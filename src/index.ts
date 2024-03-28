import { type Plugin } from '@cpn-console/hooks'
import { upsertProject } from './functions.js'
import infos from './infos.js'

export const plugin: Plugin = {
  infos,
  subscribedHooks: {
    upsertProject: {
      steps: {
        main: upsertProject,
      },
    },
    // initializeEnvironment: { steps: { post: createRbac } },
    // deleteEnvironment: { steps: { main: deleteRbac } },
    // setEnvPermission: { steps: { main: updatePermission } },
  },
}
