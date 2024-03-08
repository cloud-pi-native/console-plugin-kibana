import type { EnvironmentCreateArgs, EnvironmentDeleteArgs, PermissionManageUserArgs, StepCall } from '@cpn-console/hooks'
import { addUserToGroup, createGroup, createRbacK8s, deleteGroupK8s, deleteRbacK8s, getGroup, getRbac, removeUserFromGroup } from './kubernetes.js'
import { generateNamespaceName } from './utils.js'

export const createRbac: StepCall<EnvironmentCreateArgs> = async (payload) => {
  try {
    const { organization, project, environment, cluster, owner } = payload.args
    console.log(`Kibana plugin initialized for project: ${project}`)
    const namespace = generateNamespaceName(organization, project, environment)

    // RW
    const groupRwName = `${project}-group-rw`
    let groupRw = await getGroup(cluster, groupRwName)
    if (!groupRw) {
      console.log(`Create group RW ${groupRwName}`)
      groupRw = await createGroup(cluster, owner.id, groupRwName)
    }

    const rbacRwName = `${namespace}-rw`
    let rbacRw = await getRbac(cluster, namespace, rbacRwName)
    if (!rbacRw) {
      console.log(`Create rbac: ${rbacRwName} in namespace: ${namespace}`)
      rbacRw = await createRbacK8s(cluster, namespace, groupRwName, rbacRwName, 'edit')
    }

    // RO
    const groupRoName = `${project}-group-ro`
    let groupRo = await getGroup(cluster, groupRoName)
    if (!groupRo) {
      console.log(`Create group RO ${groupRoName}`)
      groupRo = await createGroup(cluster, '', groupRoName)
    }

    const rbacRoName = `${namespace}-ro`
    let rbacRo = await getRbac(cluster, namespace, rbacRoName)
    if (!rbacRo) {
      console.log(`Create rbac: ${rbacRoName} in namespace: ${namespace}`)
      rbacRo = await createRbacK8s(cluster, namespace, groupRoName, rbacRoName, 'view')
    }

    return {
      status: {
        result: 'OK',
        message: 'Created',
      },
      result: {
        groupRw,
        rbacRw,
        groupRo,
        rbacRo,
      },
    }
  } catch (error) {
    return {
      status: {
        result: 'OK',
        message: 'Fail to create rbac for kibana',
      },
      error: JSON.stringify(error),
    }
  }
}

export const deleteRbac: StepCall<EnvironmentDeleteArgs> = async (payload) => {
  try {
    const { organization, project, environment, cluster } = payload.args
    console.log(`Kibana plugin delete for project: ${project}`)
    const namespace = generateNamespaceName(organization, project, environment)

    // RW
    const groupRwName = `${project}-group-rw`
    const groupRw = await getGroup(cluster, groupRwName)
    if (groupRw) {
      console.log(`Delete group ${groupRwName}`)
      await deleteGroupK8s(cluster, groupRwName)
    }

    const rbacRwName = `${namespace}-rw`
    const rbacRw = await getRbac(cluster, namespace, rbacRwName)
    if (rbacRw) {
      console.log(`Delete rbac: ${rbacRwName} in namespace: ${namespace}`)
      await deleteRbacK8s(namespace, cluster, rbacRwName)
    }

    // RO
    const groupRoName = `${project}-group-ro`
    const groupRo = await getGroup(cluster, groupRoName)
    if (groupRo) {
      console.log(`Delete group ${groupRoName}`)
      await deleteGroupK8s(cluster, groupRoName)
    }

    const rbacRoName = `${namespace}-ro`
    const rbacRo = await getRbac(cluster, namespace, rbacRoName)
    if (rbacRo) {
      console.log(`Delete rbac: ${rbacRoName} in namespace: ${namespace}`)
      await deleteRbacK8s(namespace, cluster, rbacRoName)
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
        message: 'Fail to create rbac for kibana',
      },
      error: JSON.stringify(error),
    }
  }
}

export const updatePermission: StepCall<PermissionManageUserArgs> = async (payload) => {
  try {
    const { project, cluster, user, permissions } = payload.args

    const groupRwName = `${project}-group-rw`
    const groupRoName = `${project}-group-ro`

    // RW
    if (permissions.rw) {
      await removeUserFromGroup(cluster, user.id, groupRoName)
      await addUserToGroup(cluster, user.id, groupRwName)
      console.log(`user ${user.email} added to ${groupRwName}`)
    } else if (permissions.ro) {
      // RO
      await removeUserFromGroup(cluster, user.id, groupRwName)
      await addUserToGroup(cluster, user.id, groupRoName)
      console.log(`user removed from ${groupRwName} and added to ${groupRoName}`)
    } else {
      await removeUserFromGroup(cluster, user.id, groupRwName)
      await removeUserFromGroup(cluster, user.id, groupRoName)
      console.log('user removed from all groups')
    }

    const groupRw = await getGroup(cluster, groupRwName)
    const groupRo = await getGroup(cluster, groupRoName)

    return {
      status: {
        result: 'OK',
        message: 'Updated',
      },
      result: {
        groupRw,
        groupRo,
      },
    }
  } catch (error) {
    return {
      status: {
        result: 'OK',
        message: 'Fail to update user permission for kibana',
      },
      error: JSON.stringify(error),
    }
  }
}
