type Cluster = {
  infos?: string | null,
  label: string,
}

export const getKibanaUrls = (clusters: Cluster[]) => clusters.reduce((tos, cluster) => {
  if (!cluster.infos) {
    return tos
  }
  const infosArray = cluster.infos.split('\n')
  const urlInfo = infosArray.find(infos => infos.split('=')[0] === 'url')
  return urlInfo
    ? [...tos, {
        to: `${urlInfo.split('=')[1]}`,
        title: `Kibana ${cluster.label}`,
      }]
    : tos
}, [] as { to: string, title: string }[])
