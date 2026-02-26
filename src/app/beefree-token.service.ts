import { Injectable } from '@angular/core';
import type { IToken } from '@beefree.io/angular-email-builder';

/**
 * ************************************************************
 *                      !!!! WARNING !!!!
 *
 *  This service calls the Beefree auth endpoint directly from
 *  the frontend to get the example working. In production you
 *  MUST proxy this through your own backend server so that your
 *  client credentials are never exposed to end users.
 *
 *  See beefree-sdk-examples/secure-auth-example for a reference
 *  server implementation.
 * ************************************************************
 */

const AUTH_URL = 'https://auth.getbee.io/loginV2';

@Injectable({
  providedIn: 'root'
})
export class BeefreeTokenService {

  async getToken(
    clientId: string,
    clientSecret: string,
    userId = 'user'
  ): Promise<IToken> {
    let response: Response;
    try {
      response = await fetch(AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          uid: userId,
        }),
      });
    } catch {
      throw new Error('Authentication failed: unable to reach the authentication server');
    }

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(
        `Authentication failed: ${response.status} ${body || response.statusText}`
      );
    }

    return response.json();
  }

  async getBuilderToken(clientId: string, clientSecret: string, userId?: string): Promise<IToken> {
    return this.getToken(clientId, clientSecret, userId);
  }
}
