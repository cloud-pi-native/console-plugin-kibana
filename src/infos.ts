// @ts-nocheck

import type { ServiceInfos } from 'dso-console/apps/server/types/plugins/services.js'

const infos: ServiceInfos = {
  name: 'logging',
  to: ({ clusters }) => {
    const urls = []
    clusters.forEach(cluster => {
      urls.push(`https://logging.apps.${cluster.label}.numerique-interieur.com`)
    })
    return urls
  },
  title: `Observabilité ${cluster.label}`,
  imgSrc: 'https://static-www.elastic.co/v3/assets/bltefdd0b53724fa2ce/blt4466841eed0bf232/5d082a5e97f2babb5af907ee/logo-kibana-32-color.svg',
  description: 'Service d\'observabilité permettant de consulter ses logs',
}

export default infos
