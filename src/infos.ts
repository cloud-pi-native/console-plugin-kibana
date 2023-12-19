// @ts-nocheck

import type { ServiceInfos } from '@dso-console/server/src/plugins/services.js'


const infos: ServiceInfos = {
  name: 'obervability',
  to: () => `https://google.com`,
  title: 'Observabilité',
  imgSrc: 'https://www.gravitee.io/hubfs/Gravitee_2022/Images/logo-dark.svg',
  description: 'Service d\'observabilité permettant de consulter ses logs',
}

export default infos