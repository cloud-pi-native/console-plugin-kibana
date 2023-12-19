// @ts-nocheck

import type { RegisterFn } from '@dso-console/server/src/plugins/index.js'
import infos from './infos.js'
import { createRbac, deleteRbac, getDsoProjectSecrets } from './index.js'

export const init = (register: RegisterFn) => {
  register(
    infos.name,
    {
      initializeEnvironment: {
        post: createRbac,
      },
      archiveProject: { main: deleteRbac },
      getProjectSecrets: { main: getDsoProjectSecrets },
    },
  )
}