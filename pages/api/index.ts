import axios from 'axios'
import type { NextApiRequest, NextApiResponse } from 'next'
import { posix as pathPosix } from 'path'

import apiConfig from '../../config/api.json'
import siteConfig from '../../config/site.json'
import { compareHashedToken } from '../../utils/tools'

const basePath = pathPosix.resolve('/', apiConfig.base)
const encodePath = (path: string) => {
  let encodedPath = pathPosix.join(basePath, pathPosix.resolve('/', path))
  if (encodedPath === '/' || encodedPath === '') {
    return ''
  }
  encodedPath = encodedPath.replace(/\/$/, '')
  return `:${encodeURIComponent(encodedPath)}`
}

// Store access token in memory, cuz Vercel doesn't provide key-value storage natively
let _access_token = 'eyJ0eXAiOiJKV1QiLCJub25jZSI6ImxpZjJ1MW55dnlzc3BZbG1QU1RCT1R3VTBLWFVySjItVU4xSGoxS2x2b0UiLCJhbGciOiJSUzI1NiIsIng1dCI6Imwzc1EtNTBjQ0g0eEJWWkxIVEd3blNSNzY4MCIsImtpZCI6Imwzc1EtNTBjQ0g0eEJWWkxIVEd3blNSNzY4MCJ9.eyJhdWQiOiIwMDAwMDAwMy0wMDAwLTAwMDAtYzAwMC0wMDAwMDAwMDAwMDAiLCJpc3MiOiJodHRwczovL3N0cy53aW5kb3dzLm5ldC8zMDNiZDcyNC02MjNkLTQ3ZjUtYTU4MC1lZWYxYTBhZDM1ZmQvIiwiaWF0IjoxNjM0NDUxNjUzLCJuYmYiOjE2MzQ0NTE2NTMsImV4cCI6MTYzNDQ1NTU1MywiYWNjdCI6MCwiYWNyIjoiMSIsImFpbyI6IkFTUUEyLzhUQUFBQXN4MzBBdERCTDdMVngzZlNheC8zSFVhQi9rL05waC9HWjRJeU13TFBhOFU9IiwiYW1yIjpbInB3ZCJdLCJhcHBfZGlzcGxheW5hbWUiOiJmYSIsImFwcGlkIjoiY2FhNmRiMWYtYjc3MS00YTc5LThmZjMtMDFiNmI2YzE0ZjJkIiwiYXBwaWRhY3IiOiIxIiwiZGV2aWNlaWQiOiI1NWJmNTk0Zi04ZGQ1LTRiNjItODY3ZC1kMWVhMjlmZWU4MTIiLCJmYW1pbHlfbmFtZSI6Ik5PIiwiZ2l2ZW5fbmFtZSI6IlMiLCJpZHR5cCI6InVzZXIiLCJpcGFkZHIiOiIxMTYuMjYuMTYuMjAyIiwibmFtZSI6Ik5PIFMiLCJvaWQiOiIxZDMyNzdhOS04MjJmLTRhZTMtODMwOS02ZTA5YjA3MTUyNmEiLCJwbGF0ZiI6IjMiLCJwdWlkIjoiMTAwMzIwMDE5ODFDOEM1OSIsInJoIjoiMC5BWEFBSk5jN01EMWk5VWVsZ083eG9LMDFfUl9icHNweHQzbEtqX01CdHJiQlR5MXdBTjQuIiwic2NwIjoiRmlsZXMuUmVhZCBGaWxlcy5SZWFkLkFsbCBwcm9maWxlIG9wZW5pZCBlbWFpbCIsInNpZ25pbl9zdGF0ZSI6WyJrbXNpIl0sInN1YiI6InpLTmg1WEZKcnFSS0x5amcxeGw4VWtDZ3NLRjliV2RWNHFPZHdnbkMxa1UiLCJ0ZW5hbnRfcmVnaW9uX3Njb3BlIjoiQVMiLCJ0aWQiOiIzMDNiZDcyNC02MjNkLTQ3ZjUtYTU4MC1lZWYxYTBhZDM1ZmQiLCJ1bmlxdWVfbmFtZSI6IlBIT1RPU0hBUkVAdnN3ZWV0LnJlbiIsInVwbiI6IlBIT1RPU0hBUkVAdnN3ZWV0LnJlbiIsInV0aSI6IkZJUWdXZTRuaDAySm81ZHBJWTJ1QUEiLCJ2ZXIiOiIxLjAiLCJ3aWRzIjpbImI3OWZiZjRkLTNlZjktNDY4OS04MTQzLTc2YjE5NGU4NTUwOSJdLCJ4bXNfc3QiOnsic3ViIjoiZzRSNEgyT204RTRvNTFZdmRqNS1IUXV3V0JqaTlsa1RkNXYySFE1V3M5cyJ9LCJ4bXNfdGNkdCI6MTYyNTk4MjI1NH0.Pfx_R120WdFyVm-3AyKiRLANgyzJ_4X3pmsQW6yvfd9TumMvo72JfgxLQJHzK_yGX7AbvC6RrT24QkwOFgfvMuIq8HwxzxmNSPAimVcS4VHRs9Jp7roDPBeQyh4IrqjiYA-3nQEa_d3I1IkvvxaaLJhOITyjVmlZqJso7XNR5tNQOxzMrYwKNzPuh89WWcuh1P2tIR3ypJj-xkdPK9kwkl3_GUosx4MnBbrl6EzS_VBGxO4U_Iw_c-qGaLpBI9knxGKZoOOGFzIWXcKAqIL3OjNy26subewtIN8C10F2pygvuNbQ68G-V4r4DkcNGQqepKEROcML_zuav7eX_9s6sA
'
const getAccessToken = async () => {
  if (_access_token) {
    console.log('Fetch token from memory.')
    return _access_token
  }

  const body = new URLSearchParams()
  body.append('client_id', apiConfig.clientId)
  body.append('redirect_uri', apiConfig.redirectUri)
  body.append('client_secret', process.env.CLIENT_SECRET ? process.env.CLIENT_SECRET : '')
  body.append('refresh_token', process.env.REFRESH_TOKEN ? process.env.REFRESH_TOKEN : '')
  body.append('grant_type', 'refresh_token')

  const resp = await axios.post(apiConfig.authApi, body, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  })

  if (resp.data.access_token) {
    _access_token = resp.data.access_token
    return _access_token
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { path = '/', raw = false, next = '' } = req.query
  if (path === '[...path]') {
    res.status(400).json({ error: 'No path specified.' })
    return
  }

  if (typeof path === 'string') {
    const accessToken = await getAccessToken()

    // Handle authentication through .password
    const protectedRoutes = siteConfig.protectedRoutes
    let authTokenPath = ''
    for (const r of protectedRoutes) {
      if (path.startsWith(r)) {
        authTokenPath = `${r}/.password`
        break
      }
    }

    // Fetch password from remote file content
    if (authTokenPath !== '') {
      try {
        const token = await axios.get(`${apiConfig.driveApi}/root${encodePath(authTokenPath)}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: {
            select: '@microsoft.graph.downloadUrl,file',
          },
        })

        // Handle request and check for header 'od-protected-token'
        const odProtectedToken = await axios.get(token.data['@microsoft.graph.downloadUrl'])
        // console.log(req.headers['od-protected-token'], odProtectedToken.data.trim())

        if (!compareHashedToken(req.headers['od-protected-token'] as string, odProtectedToken.data)) {
          res.status(401).json({ error: 'Password required for this folder.' })
          return
        }
      } catch (error: any) {
        // Password file not found, fallback to 404
        if (error.response.status === 404) {
          res.status(404).json({ error: "You didn't set a password for your protected folder." })
        }
        res.status(500).end()
        return
      }
    }

    // Handle response from OneDrive API
    const requestUrl = `${apiConfig.driveApi}/root${encodePath(path)}`

    // Go for file raw download link and query with only temporary link parameter
    if (raw) {
      const { data } = await axios.get(requestUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          select: '@microsoft.graph.downloadUrl,folder,file',
        },
      })

      if ('folder' in data) {
        res.status(400).json({ error: "Folders doesn't have raw download urls." })
        return
      }
      if ('file' in data) {
        res.redirect(data['@microsoft.graph.downloadUrl'])
        return
      }
    }

    // Querying current path identity (file or folder) and follow up query childrens in folder
    // console.log(accessToken)

    const { data: identityData } = await axios.get(requestUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: {
        select: '@microsoft.graph.downloadUrl,name,size,id,lastModifiedDateTime,folder,file',
      },
    })

    if ('folder' in identityData) {
      const { data: folderData } = await axios.get(`${requestUrl}:/children`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: next
          ? {
              select: '@microsoft.graph.downloadUrl,name,size,id,lastModifiedDateTime,folder,file',
              top: siteConfig.maxItems,
              $skipToken: next,
            }
          : {
              select: '@microsoft.graph.downloadUrl,name,size,id,lastModifiedDateTime,folder,file',
              top: siteConfig.maxItems,
            },
      })

      // Extract next page token from full @odata.nextLink
      const nextPage = folderData['@odata.nextLink']
        ? folderData['@odata.nextLink'].match(/&\$skiptoken=(.+)/i)[1]
        : null

      // Return paging token if specified
      if (nextPage) {
        res.status(200).json({ folder: folderData, next: nextPage })
      } else {
        res.status(200).json({ folder: folderData })
      }
      return
    }
    res.status(200).json({ file: identityData })
    return
  }

  res.status(404).json({ error: 'Path query invalid.' })
  return
}
