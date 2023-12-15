// @ts-nocheck

import { EnvironmentCreateArgs, EnvironmentDeleteArgs } from '@dso-console/server/src/plugins/hooks'
import { StepCall } from '@dso-console/server/src/plugins/hooks/hook.js'
import type { ProjectBase } from '@dso-console/server/src/plugins/hooks/project.js'


export const createRbac: StepCall<EnvironmentCreateArgs> = async (payload) => {

}

export const deleteRbac: StepCall<EnvironmentDeleteArgs> =  async (payload) => {

}

export const getDsoProjectSecrets: StepCall<ProjectBase> = async (payload) => {

}