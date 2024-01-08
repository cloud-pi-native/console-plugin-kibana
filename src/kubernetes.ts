import { createCustomObjectsApi, createRbacV1Api } from './k8sApi.js'
import { getkcClient } from './keycloak.js'

const getGroupName = (project: string, organization: string): string => {
  return `${organization}-${project}-group-ro`
}

const getRbacName = (envName: string): string => {
  return `${envName}-view`
}

export const createGroup = async (cluster, project: string, ownerId: string, organization: string) => {
  const groupName = getGroupName(project, organization)
  const customObjectsApi = await createCustomObjectsApi(cluster)
  try {
    const kcClient = await getkcClient()
    const username = (await kcClient.users.findOne({ id: ownerId })).username
    const users = [username]
    const groupJson = getGroupObject(groupName, users)
    const result = await customObjectsApi.createClusterCustomObject('user.openshift.io', 'v1', 'groups', groupJson)
    console.log(JSON.stringify(result.body))
  } catch (e) {
    console.log(e)
    console.error(`Something wrong happened while creating group ${groupName}`)
  }
}

export const createRbacK8s = async (cluster, envName: string, project, organization: string) => {
  const groupName = getGroupName(project, organization)
  const rbacObjectApi = await createRbacV1Api(cluster)
  try {
    const result = await rbacObjectApi.createNamespacedRoleBinding(envName, getRbacObject(envName, groupName))
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

export const getRbacObject = (envName: string, groupName: string) => {
  const rbacName = getRbacName(envName)
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
      name: 'admin',
    },
    subjects: [{
      apiGroup: 'rbac.authorization.k8s.io',
      kind: 'Group',
      name: groupName,
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
