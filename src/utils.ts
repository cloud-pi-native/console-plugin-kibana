import { EnvironmentCreateArgs } from '@cpn-console/hooks'
import { createHmac } from 'crypto'

type Cluster = {
  infos: string,
  label: string,
}

export const getKibanaUrls = (clusters: Cluster[]) => clusters.reduce((tos, cluster) => {
  const infosArray = cluster.infos.split('\n')
  const urlInfo = infosArray.find(infos => infos.split('=')[0] === 'url')
  return urlInfo
    ? [...tos, {
        to: `${urlInfo.split('=')[1]}`,
        title: `Kibana ${cluster.label}`,
      }]
    : tos
}, [] as { to: string, title: string }[])

export const generateNamespaceName = (org: EnvironmentCreateArgs['organization'], proj: EnvironmentCreateArgs['project'], env: EnvironmentCreateArgs['environment']) => {
  const envHash = createHmac('sha256', '')
    .update(env)
    .digest('hex')
    .slice(0, 4)
  return `${org}-${proj}-${env}-${envHash}`
}
