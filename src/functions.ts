import { parseError, type Project, type StepCall } from '@cpn-console/hooks'
import { type BaseProject, ensureProjectGroup, generateProjectPermGroupName, getRolebindingObject, deleteGroups, deleteYamls } from './kubernetes.js'
import { createCustomObjectsApi } from './k8sApi.js'
import { getAllUsers, getkcClient } from './keycloak.js'
import { dump } from 'js-yaml'
import infos from './infos.js'
import { objectValues } from '@cpn-console/shared'

type SelectorParams = {
  project: string
  organization: string
  [x: string]: string
}

export const getProjectSelector = (p: SelectorParams) => [
  ...Object.entries(p).map(([key, value]) => `dso/${key}=${value}`),
  'app.kubernetes.io/managed-by=dso-console',
].join(',')

export const upsertProject: StepCall<Project> = async (payload) => {
  try {
    const project = payload.args
    const { kubernetes: kubeApi, gitlab: gitlabApi } = payload.apis
    const {
      clusters,
      users,
    } = project
    const params: BaseProject = {
      project: project.name,
      organization: project.organization.name,
    }
    const kcClient = await getkcClient()

    const usersDetails = await Promise.all(getAllUsers(users, kcClient))
    const usernames = usersDetails.map(user => user.username)
    const otherClusters = clusters.filter(({ id }) => !project.environments.some(e => e.clusterId === id))
    await Promise.all(otherClusters.map(cluster => deleteYamls(cluster, params, gitlabApi)))
    const projectClusters = clusters.filter(({ id }) => project.environments.some(e => e.clusterId === id))
    for (const cluster of projectClusters) {
      const infraProject = await gitlabApi.getOrCreateInfraProject(`${cluster.zone.slug}-addons`)
      const roRoleBinding = getRolebindingObject(params, 'view', generateProjectPermGroupName(params, 'ro'), 'ro')
      const rwRoleBinding = getRolebindingObject(params, 'edit', generateProjectPermGroupName(params, 'rw'), 'rw')
      const yamls = objectValues(kubeApi.namespaces).flatMap(namespace => {
        const nsName = namespace.nsObject.metadata.name
        roRoleBinding.metadata.namespace = nsName
        rwRoleBinding.metadata.namespace = nsName
        return [dump(roRoleBinding), dump(rwRoleBinding)]
      })
      await gitlabApi.commitCreateOrUpdate(
        infraProject.id,
        yamls.join('\n---\n'),
        `${infos.name}/${params.project}/${cluster.label}/rolebindings.yaml`,
      )
      const customObjectsApi = await createCustomObjectsApi(cluster)
      await Promise.all([
        ensureProjectGroup(params, usernames, customObjectsApi, 'ro', gitlabApi, infraProject.id, cluster.label),
        ensureProjectGroup(params, usernames, customObjectsApi, 'rw', gitlabApi, infraProject.id, cluster.label),
      ])
      if (!customObjectsApi) continue
      await Promise.all([
        kubeApi.applyResourcesInAllEnvNamespaces({
          name: 'kibana-ro',
          version: 'v1',
          plural: 'rolebindings',
          group: 'rbac.authorization.k8s.io',
          body: roRoleBinding,
        }),
        kubeApi.applyResourcesInAllEnvNamespaces({
          name: 'kibana-rw',
          version: 'v1',
          plural: 'rolebindings',
          group: 'rbac.authorization.k8s.io',
          body: rwRoleBinding,
        }),
      ])
    }
    return {
      status: {
        result: 'OK',
        message: 'Created',
      },
    }
  } catch (error) {
    return {
      status: {
        result: 'KO',
        message: 'An error happend while creating Kibana resources',
      },
      error: parseError(error),
    }
  }
}

export const deleteProject: StepCall<Project> = async (payload) => {
  try {
    const project = payload.args
    const { gitlab: gitlabApi } = payload.apis

    const params: BaseProject = {
      project: project.name,
      organization: project.organization.name,
    }

    await Promise.all(project.clusters.map(cluster => deleteYamls(cluster, params, gitlabApi)))
    await Promise.all(project.clusters.map(cluster => deleteGroups(cluster, params)))

    return {
      status: {
        result: 'OK',
        message: 'Groups Deleted',
      },
    }
  } catch (error) {
    return {
      status: {
        result: 'KO',
        message: 'An error happend while deleting Kibana resources',
      },
      error: parseError(error),
    }
  }
}
