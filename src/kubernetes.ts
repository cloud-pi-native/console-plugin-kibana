import { V1RoleBinding } from '@kubernetes/client-node'
import * as k8s from '@kubernetes/client-node'
import { createCustomObjectsApi } from './k8sApi'
import { getkcClient } from './keycloak.js'
export const createGroup = async (cluster, envName: string, project: string, ownerId: string) => {
  console.log('create group : ')
  const kcClient = await getkcClient()
  const username = (await kcClient.users.findOne({ id: ownerId })).username
  const customObjectsApi = await createCustomObjectsApi(cluster)
  const users = []
  users.push(username)
  const groupJson = getGroupObject(envName, `${project}-group-ro`, users)
  console.log(groupJson)
  customObjectsApi.createClusterCustomObject('user.openshift.io', 'v1', 'groups', groupJson)
  console.log('create group ok')
}

export const createRbacK8s = async (kc: k8s.RbacAuthorizationV1Api, envName: string, project) => {
  const roleBinding = {
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
      name: 'view',
    },
    subjects: [{
      apiGroup: 'rbac.authorization.k8s.io',
      kind: 'Group',
      name: `${project}-group-ro`,
    }],
  }
  kc.createNamespacedRoleBinding(envName, roleBinding).then(response => {
    console.log(response.body)
  }).catch(error => {
    console.log(error)
  })
}

export const getGroupObject = (nsName: string, groupName: string, users: Array<string>) => {
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

export const getRoleBindingObject = (nsName: string, rbName: string): V1RoleBinding => {
  return {
    apiVersion: 'v1',
    kind: 'RoleBinding',
    metadata: {
      name: rbName,
      namespace: nsName,
      labels: {
        'app.kubernetes.io/managed-by': 'dso-console',
      },
    },
    roleRef: {
      apiGroup: 'rbac.authorization.k8s.io',
      kind: 'ClusterRole',
      name: 'view',
    },
    subjects: [],
  }
}
