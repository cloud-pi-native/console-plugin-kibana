import { EnvironmentCreateArgs } from '@cpn-console/hooks'
import { KubeConfig } from '@kubernetes/client-node'
import * as k8s from '@kubernetes/client-node'

export const createRbacV1Api = async (cluster: EnvironmentCreateArgs['cluster']) => {
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
  return kc.makeApiClient(k8s.RbacAuthorizationV1Api)
}

export const createCustomObjectsApi = async (cluster: EnvironmentCreateArgs['cluster']) => {
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
