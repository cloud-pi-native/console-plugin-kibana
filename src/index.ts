// @ts-nocheck

import { EnvironmentCreateArgs, EnvironmentDeleteArgs } from '@dso-console/server/src/plugins/hooks/index.js'
import { StepCall } from '@dso-console/server/src/plugins/hooks/hook.js'
import { createGroup, createRbacK8s, deleteGroupK8s, deleteRbacK8s, groupExist, rbacExist } from './kubernetes.js'
import { createHmac } from 'crypto'

export const createRbac: StepCall<EnvironmentCreateArgs> = async (payload) => {
  try {
    const { organization, project, environment, cluster, owner } = payload.args
    console.log(`Logging plugin initialized for project: ${project}`)
    const namespace = generateNamespaceName(organization, project, environment)
    const isGroupExist = await groupExist(project, cluster)
    const isRbacExist = await rbacExist(cluster, namespace)
    if (isGroupExist === false) {
      console.log(`Create group ${project}-group-ro`)
      createGroup(cluster, project, owner.id)
    }
    console.log(isRbacExist)
    if (isRbacExist === false) {
      console.log(`Create rbac: ${namespace}-view in namespace: ${namespace}`)
      createRbacK8s(cluster, namespace, project)
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
    const isGroupExist = await groupExist(project, cluster)
    const isRbacExist = await rbacExist(cluster, namespace)
    if (isGroupExist === true) {
      console.log(`Delete group ${project}-group-ro`)
      await deleteRbacK8s(namespace, cluster)
    }
    if (isRbacExist === true) {
      console.log(`Delete rbac: ${namespace}-view in namespace: ${namespace}`)
      await deleteGroupK8s(project, cluster)
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
