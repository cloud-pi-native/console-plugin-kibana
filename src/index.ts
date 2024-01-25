// @ts-nocheck

import { EnvironmentCreateArgs, EnvironmentDeleteArgs } from 'dso-console/apps/server/src/plugins/hooks/index.js'
import { StepCall } from '@dso-console/server/src/plugins/hooks/hook.js'
import { createGroup, createRbacK8s, deleteGroupK8s, deleteRbacK8s, groupExist, rbacExist } from './kubernetes.js'
import { createHmac } from 'crypto'

export const createRbac: StepCall<EnvironmentCreateArgs> = async (payload) => {
  try {
    const { organization, project, environment, cluster, owner } = payload.args
    console.log(`Logging plugin initialized for project: ${project}`)
    const namespace = generateNamespaceName(organization, project, environment)
    // const groupRoName = `${project}-group-ro`
    const groupRwName = `${project}-group-rw`
    // const rbacRoName = `${namespace}-ro`
    const rbacRwName = `${namespace}-rw`
    // const isGroupRoExist = await groupExist(cluster, groupRoName)
    const isGroupRwExist = await groupExist(cluster, groupRwName)
    // const isRbacRoExist = await rbacExist(cluster, namespace, rbacRoName)
    const isRbacRwExist = await rbacExist(cluster, namespace, rbacRwName)
    // if (isGroupRoExist === false) {
    //   console.log(`Create group RO ${groupRoName}`)
    //   createGroup(cluster, owner.id, groupRoName)
    // }
    if (isGroupRwExist === false) {
      console.log(`Create group RW ${groupRwName}`)
      createGroup(cluster, owner.id, groupRwName)
    }
    // if (isRbacRoExist === false) {
    //   console.log(`Create rbac: ${rbacRoName} in namespace: ${namespace}`)
    //   createRbacK8s(cluster, namespace, groupRoName, rbacRoName, 'view')
    // }
    if (isRbacRwExist === false) {
      console.log(`Create rbac: ${rbacRwName} in namespace: ${namespace}`)
      createRbacK8s(cluster, namespace, groupRwName, rbacRwName, 'view')
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
        message: 'Fail to create rbac for logging',
      },
      error: JSON.stringify(error),
    }
  }
}

export const deleteRbac: StepCall<EnvironmentDeleteArgs> = async (payload) => {
  try {
    const { organization, project, environment, cluster } = payload.args
    console.log(`Logging plugin delete for project: ${project}`)
    const namespace = generateNamespaceName(organization, project, environment)
    // const groupRoName = `${project}-group-ro`
    const groupRwName = `${project}-group-rw`
    // const rbacRoName = `${namespace}-ro`
    const rbacRwName = `${namespace}-rw`
    // const isGroupRoExist = await groupExist(cluster, groupRoName)
    const isGroupRwExist = await groupExist(cluster, groupRwName)
    // const isRbacRoExist = await rbacExist(cluster, namespace, rbacRoName)
    const isRbacRwExist = await rbacExist(cluster, namespace, rbacRwName)
    if (isRbacRwExist === true) {
      console.log(`Delete rbac: ${rbacRwName} in namespace: ${namespace}`)
      await deleteRbacK8s(namespace, cluster, rbacRwName)
    }
    // if (isRbacRoExist === true) {
    //   console.log(`Delete rbac: ${rbacRoName} in namespace: ${namespace}`)
    //   await deleteRbacK8s(namespace, cluster, rbacRoName)
    // }
    if (isGroupRwExist === true) {
      console.log(`Delete group ${groupRwName}`)
      await deleteGroupK8s(project, cluster, groupRwName)
    }
    // if (isGroupRoExist === true) {
    //   console.log(`Delete group ${groupRoName}`)
    //   await deleteGroupK8s(project, cluster, groupRoName)
    // }
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
        message: 'Fail to create rbac for logging',
      },
      error: JSON.stringify(error),
    }
  }
}

export const generateNamespaceName = (org: Organization, proj: Project, env: Environment) => {
  const envHash = createHmac('sha256', '')
    .update(env)
    .digest('hex')
    .slice(0, 4)
  return `${org}-${proj}-${env}-${envHash}`
}
