import { UserObject } from '@cpn-console/hooks'
import KcAdminClient from '@keycloak/keycloak-admin-client'

export const keycloakProtocol = process.env.KEYCLOAK_PROTOCOL
export const keycloakDomain = process.env.KEYCLOAK_DOMAIN
export const keycloakRealm = process.env.KEYCLOAK_REALM
export const keycloakToken = process.env.KEYCLOAK_ADMIN_PASSWORD
export const keycloakUser = process.env.KEYCLOAK_ADMIN

export const getkcClient = async () => {
  const kcClient = new KcAdminClient({
    baseUrl: `${keycloakProtocol}://${keycloakDomain}`,
  })

  await kcClient.auth({
    clientId: 'admin-cli',
    grantType: 'password',
    username: keycloakUser,
    password: keycloakToken,
  })
  kcClient.setConfig({ realmName: keycloakRealm })
  return kcClient
}

export const getAllUsers = (users: UserObject[], kcClient: KcAdminClient): Promise<UserObject & { username: string}>[] => {
  return users.map(async user => {
    const username = (await kcClient.users.findOne({ id: user.id }))?.username
    if (!username) throw new Error('User not found')
    return {
      ...user,
      username,
    }
  })
}
