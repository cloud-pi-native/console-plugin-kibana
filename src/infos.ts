import { type ServiceInfos } from '@cpn-console/hooks'
import { getKibanaUrls } from './utils.js'

const infos: ServiceInfos = {
  name: 'kibana',
  to: ({ clusters }) => getKibanaUrls(clusters),
  title: 'Kibana',
  imgSrc: 'https://static-www.elastic.co/v3/assets/bltefdd0b53724fa2ce/blt4466841eed0bf232/5d082a5e97f2babb5af907ee/logo-kibana-32-color.svg',
  description: 'Kibana est un outil de visualisation de logs',
}

export default infos
