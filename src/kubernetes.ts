import { ClusterObject } from '@cpn-console/hooks'
import { getProjectSelector } from './functions.js'
import { CustomObjectsApi, PatchUtils } from '@kubernetes/client-node'
import { createCustomObjectsApi } from './k8sApi.js'
import { dump } from 'js-yaml'
import { GitlabProjectApi } from '@cpn-console/gitlab-plugin/types/class.js'
import infos from './infos.js'

const patchOptions = { headers: { 'Content-type': PatchUtils.PATCH_FORMAT_JSON_MERGE_PATCH } }

type Perm = 'rw' | 'ro'

export type BaseProject = {
  project: string
  organization: string
}

export const getRolebindingObject = (params: BaseProject, groupName: string, roleName: string, perm: Perm) => {
  return {
    apiVersion: 'rbac.authorization.k8s.io/v1',
    kind: 'RoleBinding',
    metadata: {
      name: `kibana-${perm}`,
      namespace: '',
      labels: {
        'app.kubernetes.io/managed-by': 'dso-console',
        'dso/organization': params.organization,
        'dso/project': params.project,
        'dso/kibana-perm': perm,
      },
    },
    roleRef: {
      apiGroup: 'rbac.authorization.k8s.io',
      kind: 'ClusterRole',
      name: groupName,
    },
    subjects: [{
      apiGroup: 'rbac.authorization.k8s.io',
      kind: 'Group',
      name: roleName,
    }],
  }
}

const getProjectPermGroups = (customObjectsApi: CustomObjectsApi, params: BaseProject, perm: Perm) => customObjectsApi.listClusterCustomObject('user.openshift.io', 'v1', 'groups', undefined, undefined, undefined, undefined, getProjectSelector({
  organization: params.organization,
  project: params.project,
  perm,
})) as Promise<{ body: {items: { metadata: { name: string } }[] } }>

export const generateProjectPermGroupName = (params: BaseProject, perm: Perm) => `kibana-${params.organization}-${params.project}-${perm}`

export const ensureProjectGroup = async (params: BaseProject, usernames: string[], customObjectsApi: CustomObjectsApi | undefined, perm: Perm,
  gitlabApi: GitlabProjectApi, repoId: number, clusterName: string,
): Promise<string> => {
  const group = getGroupObject(params, usernames, perm)
  await gitlabApi.commitCreateOrUpdate(repoId, dump(group), `${infos.name}/${params.project}/${clusterName}/group-${perm}.yaml`)
  if (!customObjectsApi) return group.metadata.name
  const { body: { items } } = await getProjectPermGroups(customObjectsApi, params, perm)

  if (items.length === 1) {
    const group = items[0]
    if (group.metadata.name === generateProjectPermGroupName(params, perm)) {
      await customObjectsApi.patchClusterCustomObject('user.openshift.io', 'v1', 'groups', group.metadata.name, { users: usernames }, undefined, undefined, undefined, patchOptions)
      return group.metadata.name
    }
    await customObjectsApi.deleteClusterCustomObject('user.openshift.io', 'v1', 'groups', group.metadata.name)
  } else if (items.length > 1) {
    await Promise.all(
      items.map(item => customObjectsApi.deleteClusterCustomObject('user.openshift.io', 'v1', 'groups', item.metadata.name)),
    )
  }

  try {
    const group = await customObjectsApi.getClusterCustomObject('user.openshift.io', 'v1', 'groups', generateProjectPermGroupName(params, perm))
    // @ts-ignore
    await customObjectsApi.deleteClusterCustomObject('user.openshift.io', 'v1', 'groups', group.body.metadata.name)
  } catch (error) {}
  await customObjectsApi.createClusterCustomObject('user.openshift.io', 'v1', 'groups', group)
  return group.metadata.name
}

const getGroupObject = (params: BaseProject, users: string[], perm: Perm) => ({
  apiVersion: 'user.openshift.io/v1',
  kind: 'Group',
  metadata: {
    labels: {
      'app.kubernetes.io/managed-by': 'dso-console',
      'dso/project': params.project,
      'dso/organization': params.organization,
      'dso/kibana-perm': perm,
    },
    name: generateProjectPermGroupName(params, perm),
  },
  users,
})

export const deleteProjectGroup = async (params: BaseProject, customObjectsApi: CustomObjectsApi, perm: Perm) => {
  const { body: { items } } = await getProjectPermGroups(customObjectsApi, params, perm)

  await Promise.all(
    items.map(item => customObjectsApi.deleteClusterCustomObject('user.openshift.io', 'v1', 'groups', item.metadata.name)),
  )

  try {
    const group = await customObjectsApi.getClusterCustomObject('user.openshift.io', 'v1', 'groups', generateProjectPermGroupName(params, perm))
    // @ts-ignore
    await customObjectsApi.deleteClusterCustomObject('user.openshift.io', 'v1', 'groups', group.body.metadata.name)
  } catch (error) {}
}

export const deleteGroups = async (cluster: ClusterObject, params: BaseProject) => {
  const customObjectsApi = await createCustomObjectsApi(cluster)
  if (!customObjectsApi) return
  await Promise.all([
    deleteProjectGroup(params, customObjectsApi, 'ro'),
    deleteProjectGroup(params, customObjectsApi, 'rw'),
  ])
}

export const deleteYamls = async (cluster: ClusterObject, params: BaseProject, gitlabApi: GitlabProjectApi) => {
  const infraProject = await gitlabApi.getOrCreateInfraProject(`${cluster.zone.slug}-addons`)
  const projectValueFiles = await gitlabApi.listFiles(infraProject.id, `${infos.name}/${params.project}`)
  const filesToDelete = projectValueFiles.filter(f => f.type === 'blob').map(f => f.path)
  return gitlabApi.commitDelete(infraProject.id, filesToDelete)
}
