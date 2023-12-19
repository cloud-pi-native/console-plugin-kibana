// @ts-nocheck

import { EnvironmentCreateArgs, EnvironmentDeleteArgs } from '@dso-console/server/src/plugins/hooks/index.js'
import { StepCall } from '@dso-console/server/src/plugins/hooks/hook.js'
import type { ProjectBase } from '@dso-console/server/src/plugins/hooks/project.js'
import { createRbacV1Api } from './k8sApi.js'
import { createGroup, createRbacK8s } from './kubernetes.js'
import { createHmac } from 'crypto'

export const createRbac: StepCall<EnvironmentCreateArgs> = async (payload) => {
  try {
    const { organization, project, environment, cluster, owner, quota } = payload.args
    const namespace = generateNamespaceName(organization, project, environment)
    const rbac = await createRbacV1Api(cluster)
    console.log('create group')
    createGroup(cluster, namespace, project, owner.id)
    console.log('group created')
    console.log('create rbac')
    createRbacK8s(rbac, namespace, project)
    console.log('rbac created')
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

}

export const getDsoProjectSecrets: StepCall<ProjectBase> = async (payload) => {

}

export const generateNamespaceName = (org: Organization, proj: Project, env: Environment) => {
  const envHash = createHmac('sha256', '')
    .update(env)
    .digest('hex')
    .slice(0, 4)
  return `${org}-${proj}-${env}-${envHash}`
}
