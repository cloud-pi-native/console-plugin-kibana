import { EnvironmentCreateArgs } from '@cpn-console/hooks'
import { createCustomObjectsApi, createRbacV1Api } from './k8sApi.js'
import { getkcClient } from './keycloak.js'

export const createGroup = async (cluster: EnvironmentCreateArgs['cluster'], ownerId: string, group: string) => {
  const customObjectsApi = await createCustomObjectsApi(cluster)
  try {
    const kcClient = await getkcClient()
    const username = (await kcClient.users.findOne({ id: ownerId }))?.username
    if (!username) throw new Error('User not found')
    const groupJson = getGroupObject(group, [username])
    const result = await customObjectsApi.createClusterCustomObject('user.openshift.io', 'v1', 'groups', groupJson)
    console.log(JSON.stringify(result.body))
  } catch (e) {
    console.log(e)
    console.error(`Something wrong happened while creating group ${group}`)
  }
}

export const createRbacK8s = async (cluster: EnvironmentCreateArgs['cluster'], envName: string, groupName: string, rbacName: string, roleName: string) => {
  const rbacObjectApi = await createRbacV1Api(cluster)
  try {
    const result = await rbacObjectApi.createNamespacedRoleBinding(envName, getRbacObject(envName, groupName, rbacName, roleName))
    console.log(JSON.stringify(result.body))
  } catch (e) {
    console.log(e)
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

export const groupExist = async (cluster: EnvironmentCreateArgs['cluster'], group: string) => {
  const customObjectsApi = await createCustomObjectsApi(cluster)
  try {
    const result = await customObjectsApi.getClusterCustomObject('user.openshift.io', 'v1', 'groups', `${group}`)
    console.debug(JSON.stringify(result.body))
    return true
  } catch {
    console.log(`Group ${group} not exist`)
    return false
  }
}

export const rbacExist = async (cluster: EnvironmentCreateArgs['cluster'], envName: string, rbacName: string) => {
  const rbacObjectApi = await createRbacV1Api(cluster)
  try {
    const result = await rbacObjectApi.readNamespacedRoleBinding(`${rbacName}`, envName)
    console.debug(JSON.stringify(result.body))
    return true
  } catch {
    console.log(`Role binding ${rbacName} in namespace ${envName} not exist`)
    return false
  }
}

export const deleteGroupK8s = async (cluster: EnvironmentCreateArgs['cluster'], group: string) => {
  const customObjectsApi = await createCustomObjectsApi(cluster)
  try {
    const result = await customObjectsApi.deleteClusterCustomObject('user.openshift.io', 'v1', 'groups', `${group}`)
    console.debug(JSON.stringify(result.body))
  } catch (e) {
    console.log(e)
  }
}

export const deleteRbacK8s = async (envName: string, cluster: EnvironmentCreateArgs['cluster'], rbacName: string) => {
  const rbacObjectApi = await createRbacV1Api(cluster)
  try {
    const result = await rbacObjectApi.deleteNamespacedRoleBinding(`${rbacName}`, envName)
    console.debug(JSON.stringify(result.body))
  } catch (e) {
    console.log(e)
  }
}
