import { parseError, type Project, type StepCall } from '@cpn-console/hooks'
import { type BaseProject, ensureProjectGroup, generateProjectPermGroupName, getRolebindingObject, deleteGroups } from './kubernetes.js'
import { createCustomObjectsApi } from './k8sApi.js'
import { getAllUsers, getkcClient } from './keycloak.js'

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
    const { kubernetes: kubeApi } = payload.apis
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
    for (const cluster of clusters) {
      const customObjectsApi = await createCustomObjectsApi(cluster)

      await Promise.all([
        kubeApi.applyResourcesInAllEnvNamespaces({
          name: 'kibana-ro',
          version: 'v1',
          plural: 'rolebindings',
          group: 'rbac.authorization.k8s.io',
          body: getRolebindingObject(params, 'view', generateProjectPermGroupName(params, 'ro'), 'ro'),
        }),
        kubeApi.applyResourcesInAllEnvNamespaces({
          name: 'kibana-rw',
          version: 'v1',
          plural: 'rolebindings',
          group: 'rbac.authorization.k8s.io',
          body: getRolebindingObject(params, 'edit', generateProjectPermGroupName(params, 'rw'), 'rw'),
        }),
        ensureProjectGroup(params, usernames, customObjectsApi, 'ro'),
        ensureProjectGroup(params, usernames, customObjectsApi, 'rw'),
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
        result: 'OK',
        message: 'An error happend while creating Grafana instance',
      },
      error: parseError(error),
    }
  }
}

export const deleteProject: StepCall<Project> = async (payload) => {
  try {
    const project = payload.args

    const params: BaseProject = {
      project: project.name,
      organization: project.organization.name,
    }

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
        result: 'OK',
        message: 'An error happend while creating Grafana instance',
      },
      error: parseError(error),
    }
  }
}
