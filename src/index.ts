import { type Plugin } from '@cpn-console/hooks'
import { createRbac, deleteRbac } from './functions.js'
import infos from './infos.js'

export const plugin: Plugin = {
  infos,
  subscribedHooks: {
    initializeEnvironment: { steps: { post: createRbac } },
    deleteEnvironment: { steps: { main: deleteRbac } },
  },
}
