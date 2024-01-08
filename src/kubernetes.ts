import { createCustomObjectsApi, createRbacV1Api } from './k8sApi.js'
import { getkcClient } from './keycloak.js'
export const createGroup = async (cluster, project: string, ownerId: string) => {
  const customObjectsApi = await createCustomObjectsApi(cluster)
  try {
    const kcClient = await getkcClient()
    const username = (await kcClient.users.findOne({ id: ownerId })).username
    const users = []
    users.push(username)
    const groupJson = getGroupObject(`${project}-group-ro`, users)
    const result = await customObjectsApi.createClusterCustomObject('user.openshift.io', 'v1', 'groups', groupJson)
    console.log(JSON.stringify(result.body))
  } catch (e) {
    console.log(e)
    console.error(`Something wrong happened while creating group ${project}-group-ro`)
  }
}

export const createRbacK8s = async (cluster, envName: string, project) => {
  const rbacObjectApi = await createRbacV1Api(cluster)
  try {
    const result = await rbacObjectApi.createNamespacedRoleBinding(envName, getRbacObject(envName, project))
    console.log(JSON.stringify(result.body))
  } catch (e) {
    console.log(e)
    console.error(`Something wrong happened while creating rbac ${envName}-view in namespace ${envName}`)
  }
}

export const getGroupObject = (groupName: string, users: Array<string>) => {
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

export const getRbacObject = (envName: string, project: string) => {
  return {
    apiVersion: 'rbac.authorization.k8s.io/v1',
    kind: 'RoleBinding',
    metadata: {
      name: `${envName}-view`,
      namespace: envName,
      labels: {
        'app.kubernetes.io/managed-by': 'dso-console',
      },
    },
    roleRef: {
      apiGroup: 'rbac.authorization.k8s.io',
      kind: 'ClusterRole',
      name: 'admin',
    },
    subjects: [{
      apiGroup: 'rbac.authorization.k8s.io',
      kind: 'Group',
      name: `${project}-group-ro`,
    }],
  }
}

export const groupExist = async (project: string, cluster) => {
  const customObjectsApi = await createCustomObjectsApi(cluster)
  try {
    const result = await customObjectsApi.getClusterCustomObject('user.openshift.io', 'v1', 'groups', `${project}-group-ro`)
    console.log(JSON.stringify(result.body))
    return true
  } catch {
    console.log(`Group ${project}-group-ro not exist`)
    return false
  }
}

export const rbacExist = async (cluster, envName: string) => {
  const rbacObjectApi = await createRbacV1Api(cluster)
  try {
    const result = await rbacObjectApi.readNamespacedRoleBinding(`${envName}-view`, envName)
    console.log(JSON.stringify(result.body))
    return true
  } catch {
    console.log(`Role binding ${envName}-view in namespace ${envName} not exist`)
    return false
  }
}

export const deleteGroupK8s = async (project: string, cluster) => {
  const customObjectsApi = await createCustomObjectsApi(cluster)
  try {
    const result = await customObjectsApi.deleteClusterCustomObject('user.openshift.io', 'v1', 'groups', `${project}-group-ro`)
    console.log(JSON.stringify(result.body))
  } catch (e) {
    console.log(e)
  }
}

export const deleteRbacK8s = async (envName: string, cluster) => {
  const rbacObjectApi = await createRbacV1Api(cluster)
  try {
    const result = await rbacObjectApi.deleteNamespacedRoleBinding(`${envName}-view`, envName)
    console.log(JSON.stringify(result.body))
  } catch (e) {
    console.log(e)
  }
}
