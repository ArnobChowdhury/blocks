import { shell } from 'electron';
import {
  OAuth2Client,
  ClientAuthentication,
  CodeChallengeMethod,
} from 'google-auth-library';

import http from 'http';
import crypto from 'crypto';
import getPort from 'get-port';
import { promises as fs } from 'fs';
import { getAssetPath } from './util';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

const oauth2Client = new OAuth2Client({
  clientId: CLIENT_ID,
  clientAuthentication: ClientAuthentication.None,
});

const LOGO_PLACEHOLDER = '<!-- LOGO_PLACEHOLDER -->';
const REDIRECT_HOST = '127.0.0.1';
const REDIRECT_ORIGIN = `http://${REDIRECT_HOST}`;

function generateCodeVerifier() {
  return crypto.randomBytes(32).toString('hex');
}

function generateCodeChallenge(verifier: string) {
  return crypto
    .createHash('sha256')
    .update(verifier)
    .digest()
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function serveHtmlPage(res: http.ServerResponse, filePath: string) {
  const htmlContent = await fs.readFile(filePath, 'utf-8');
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(htmlContent);
}

async function serveSuccessPage(
  res: http.ServerResponse,
  templatePath: string,
  logoPath: string,
) {
  const [htmlTemplate, logoContent] = await Promise.all([
    fs.readFile(templatePath, 'utf-8'),
    fs.readFile(logoPath, 'utf-8'),
  ]);
  const htmlContent = htmlTemplate.replace(LOGO_PLACEHOLDER, logoContent);
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(htmlContent);
}

type OAuthPromise = {
  resolve: (value: {
    code: string;
    redirectUri: string;
    codeVerifier: string;
  }) => void;
  reject: (reason?: any) => void;
};

const createRequestHandler =
  (
    promise: OAuthPromise,
    cleanup: () => void,
    codeVerifier: string,
    paths: { success: string; cancelled: string; error: string; logo: string },
  ) =>
  async (req: http.IncomingMessage, res: http.ServerResponse) => {
    try {
      if (!req.url) {
        throw new Error('Request URL not found');
      }

      const url = new URL(req.url, `http://${req.headers.host}`);
      const code = url.searchParams.get('code');
      const error = url.searchParams.get('error');
      const redirectUri = `${REDIRECT_ORIGIN}:${req.socket.localPort}`;

      if (error) {
        await serveHtmlPage(res, paths.cancelled);
        throw new Error(`Google OAuth Error: ${error}`);
      }

      if (code) {
        await serveSuccessPage(res, paths.success, paths.logo);
        cleanup();
        promise.resolve({ code, redirectUri, codeVerifier });
      } else {
        await serveHtmlPage(res, paths.error);
        throw new Error('Authorization code not found in redirect URL.');
      }
    } catch (err) {
      cleanup();
      promise.reject(err);
    }
  };

/**
 * Starts the OAuth flow to get an authorization code from Google.
 * @returns A promise that resolves with the authorization code and the redirect URI used.
 */
export const startOAuthFlow = async (): Promise<{
  code: string;
  redirectUri: string;
  codeVerifier: string;
}> => {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);
  const GOOGLE_AUTH_SUCCESS_HTML_PATH = getAssetPath('auth-redirect.html');
  const GOOGLE_AUTH_CANCELLED_HTML_PATH = getAssetPath('auth-cancelled.html');
  const GOOGLE_AUTH_ERROR_HTML_PATH = getAssetPath('auth-error.html');
  const LOGO_PATH = getAssetPath('logo.svg');

  return new Promise((resolve, reject) => {
    let server: http.Server;

    const timeoutId = setTimeout(() => {
      if (server) {
        server.close();
      }
      reject(new Error('Authentication timed out.'));
    }, 300000); // 5 minutes

    const cleanup = () => {
      clearTimeout(timeoutId);
      if (server) server.close();
    };

    const requestHandler = createRequestHandler(
      { resolve, reject },
      cleanup,
      codeVerifier,
      {
        success: GOOGLE_AUTH_SUCCESS_HTML_PATH,
        cancelled: GOOGLE_AUTH_CANCELLED_HTML_PATH,
        error: GOOGLE_AUTH_ERROR_HTML_PATH,
        logo: LOGO_PATH,
      },
    );

    server = http.createServer(requestHandler);

    server.on('error', reject);

    getPort({ port: [24681, 24682, 24683] }).then((port) => {
      server.listen(port, REDIRECT_HOST, () => {
        const redirectUri = `${REDIRECT_ORIGIN}:${port}`;

        const authUrl = oauth2Client.generateAuthUrl({
          access_type: 'offline',
          response_type: 'code',
          scope: ['openid', 'email', 'profile'],
          code_challenge: codeChallenge,
          code_challenge_method: CodeChallengeMethod.S256,
          redirect_uri: redirectUri,
        });
        shell.openExternal(authUrl);
      });
    });
  });
};
