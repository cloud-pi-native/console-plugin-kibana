// @ts-nocheck

import type { ServiceInfos } from '@dso-console/server/types/plugins/services.js'

const infos: ServiceInfos = {
  name: 'logging',
  to: ({ clusters }) => {
    return getKibanaUrls({ clusters })
  },
  title: 'Observabilité',
  imgSrc: 'https://static-www.elastic.co/v3/assets/bltefdd0b53724fa2ce/blt4466841eed0bf232/5d082a5e97f2babb5af907ee/logo-kibana-32-color.svg',
  description: 'Service d\'observabilité permettant de consulter ses logs',
}

const getKibanaUrls = ({ clusters }: ToUrlFnParamaters) => clusters.reduce((tos, cluster) => {
  const infosArray = cluster.infos.split('\n')
  const urlInfo = infosArray.find(infos => infos.split('=')[0] === 'url')
  return urlInfo
    ? [...tos, {
      to: `${urlInfo.split('=')[1]}`,
      title: `Logging ${cluster.label}`,
    }]
    : tos
}, [] as Array<{ to: string, title: string }>)

export default infos
