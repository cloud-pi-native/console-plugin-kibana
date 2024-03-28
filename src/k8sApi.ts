import type { ClusterObject } from '@cpn-console/hooks'
import { KubeConfig } from '@kubernetes/client-node'
import * as k8s from '@kubernetes/client-node'

export const createCustomObjectsApi = async (cluster: ClusterObject) => {
  const kc = new KubeConfig()
  const clusterConfig = {
    ...cluster.cluster,
    skipTLSVerify: cluster.cluster.skipTLSVerify ?? false,
    name: 'useless',
  }
  const userConfig = {
    ...cluster.user,
    name: 'useless',
  }
  if (cluster.cluster.skipTLSVerify) delete clusterConfig.caData
  kc.loadFromClusterAndUser(clusterConfig, userConfig)
  return kc.makeApiClient(k8s.CustomObjectsApi)
}
