import { EnvironmentCreateArgs } from '@cpn-console/hooks'
import { PATCH_FORMAT_JSON_PATCH, createCustomObjectsApi, createRbacV1Api } from './k8sApi.js'
import { getkcClient } from './keycloak.js'

export const createGroup = async (cluster: EnvironmentCreateArgs['cluster'], ownerId: string, group: string) => {
  try {
    const customObjectsApi = await createCustomObjectsApi(cluster)
    const kcClient = await getkcClient()
    const username = (await kcClient.users.findOne({ id: ownerId }))?.username
    if (!username) throw new Error('User not found')
    const groupJson = getGroupObject(group, [username])
    const result = await customObjectsApi.createClusterCustomObject('user.openshift.io', 'v1', 'groups', groupJson)
    return result.body
  } catch (error) {
    if (error instanceof Error) {
      console.log(error)
    }
    console.error(`Something wrong happened while creating group ${group}`)
  }
}

export const addUserToGroup = async (cluster: EnvironmentCreateArgs['cluster'], userId: string, group: string) => {
  try {
    const customObjectsApi = await createCustomObjectsApi(cluster)
    const kcClient = await getkcClient()

    const username = (await kcClient.users.findOne({ id: userId }))?.username
    if (!username) throw new Error('User not found')

    let k8sGroup = await getGroup(cluster, group)

    if (!k8sGroup) {
      console.log(`creating group ${group}`)
      k8sGroup = getGroupObject(group, [username])
      const result = await customObjectsApi.createClusterCustomObject('user.openshift.io', 'v1', 'groups', k8sGroup)
      return result.body
    }

    // @ts-ignore
    if (k8sGroup.users.some((user: string) => user === username)) return k8sGroup

    const patch = [{
      op: 'add',
      path: '/users/-',
      value: username,
    }]

    // @ts-ignore
    const result = await customObjectsApi.patchClusterCustomObject('user.openshift.io', 'v1', 'groups', k8sGroup.metadata.name, patch, undefined, undefined, undefined, { headers: { 'Content-Type': PATCH_FORMAT_JSON_PATCH } })
    return result.body
  } catch (error) {
    if (error instanceof Error) {
      console.log(error.message)
    }
    console.error(`Something wrong happened while adding user to group ${group}`)
  }
}

export const removeUserFromGroup = async (cluster: EnvironmentCreateArgs['cluster'], userId: string, group: string) => {
  try {
    const customObjectsApi = await createCustomObjectsApi(cluster)
    const kcClient = await getkcClient()

    const username = (await kcClient.users.findOne({ id: userId }))?.username
    if (!username) throw new Error('User not found')

    let k8sGroup = await getGroup(cluster, group)

    if (!k8sGroup) {
      console.log(`creating group ${group}`)
      k8sGroup = getGroupObject(group, [])
      const result = await customObjectsApi.createClusterCustomObject('user.openshift.io', 'v1', 'groups', k8sGroup)
      return result.body
    }

    // @ts-ignore
    if (!k8sGroup.users.some((user: string) => user === username)) return k8sGroup

    // @ts-ignore
    const userIndx = k8sGroup.users.findIndex((user: string) => user === username)

    const patch = [{
      op: 'remove',
      path: `/users/${userIndx}`,
    }]

    // @ts-ignore
    const result = await customObjectsApi.patchClusterCustomObject('user.openshift.io', 'v1', 'groups', k8sGroup.metadata.name, patch, undefined, undefined, undefined, { headers: { 'Content-Type': PATCH_FORMAT_JSON_PATCH } })
    return result.body
  } catch (error) {
    if (error instanceof Error) {
      console.log(error.message)
    }
    console.error(`Something wrong happened while removing user from group ${group}`)
  }
}

export const createRbacK8s = async (cluster: EnvironmentCreateArgs['cluster'], envName: string, groupName: string, rbacName: string, roleName: string) => {
  try {
    const rbacObjectApi = await createRbacV1Api(cluster)
    const result = await rbacObjectApi.createNamespacedRoleBinding(envName, getRbacObject(envName, groupName, rbacName, roleName))
    return result.body
  } catch (error) {
    if (error instanceof Error) {
      console.log(error.message)
    }
    console.error(`Something wrong happened while creating rbac ${envName}-view in namespace ${envName}`)
  }
}

export const getGroupObject = (groupName: string, users: string[]) => {
  return {
    apiVersion: 'user.openshift.io/v1',
    kind: 'Group',
    metadata: {
      name: groupName,
      labels: {
        'app.kubernetes.io/managed-by': 'dso-console',
      },
    },
    users,
  }
}

export const getRbacObject = (envName: string, groupName: string, rbacName: string, roleName: string) => {
  return {
    apiVersion: 'rbac.authorization.k8s.io/v1',
    kind: 'RoleBinding',
    metadata: {
      name: rbacName,
      namespace: envName,
      labels: {
        'app.kubernetes.io/managed-by': 'dso-console',
      },
    },
    roleRef: {
      apiGroup: 'rbac.authorization.k8s.io',
      kind: 'ClusterRole',
      name: roleName,
    },
    subjects: [{
      apiGroup: 'rbac.authorization.k8s.io',
      kind: 'Group',
      name: groupName,
    }],
  }
}

export const getGroup = async (cluster: EnvironmentCreateArgs['cluster'], group: string) => {
  try {
    const customObjectsApi = await createCustomObjectsApi(cluster)
    const result = await customObjectsApi.getClusterCustomObject('user.openshift.io', 'v1', 'groups', `${group}`)
    return result.body
  } catch {
    console.log(`Group ${group} not found`)
  }
}

export const getRbac = async (cluster: EnvironmentCreateArgs['cluster'], envName: string, rbacName: string) => {
  try {
    const rbacObjectApi = await createRbacV1Api(cluster)
    const result = await rbacObjectApi.readNamespacedRoleBinding(`${rbacName}`, envName)
    return result.body
  } catch {
    console.log(`Role binding ${rbacName} in namespace ${envName} not found`)
  }
}

export const deleteGroupK8s = async (cluster: EnvironmentCreateArgs['cluster'], group: string) => {
  try {
    const customObjectsApi = await createCustomObjectsApi(cluster)
    const result = await customObjectsApi.deleteClusterCustomObject('user.openshift.io', 'v1', 'groups', `${group}`)
    console.debug(JSON.stringify(result.body))
  } catch (error) {
    if (error instanceof Error) {
      console.log(error.message)
    }
  }
}

export const deleteRbacK8s = async (envName: string, cluster: EnvironmentCreateArgs['cluster'], rbacName: string) => {
  try {
    const rbacObjectApi = await createRbacV1Api(cluster)
    const result = await rbacObjectApi.deleteNamespacedRoleBinding(`${rbacName}`, envName)
    console.debug(JSON.stringify(result.body))
  } catch (error) {
    if (error instanceof Error) {
      console.log(error.message)
    }
  }
}
