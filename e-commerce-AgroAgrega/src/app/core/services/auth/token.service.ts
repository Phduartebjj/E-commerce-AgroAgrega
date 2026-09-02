import { inject, Injectable, PLATFORM_ID } from "@angular/core";
import { isPlatformBrowser } from "@angular/common";
import { UserTokenModel } from "@models/user";
import * as crypt from 'crypto-js';

@Injectable({
  providedIn: 'root'
})
export class TokenAuth{
    private readonly key: string = "auth_token"; // Chave do cookie
    private readonly sessionKey: string = "auth_session";
    private readonly maxAge: number = 60 * 5;// Data de expiração da chave
    private readonly ultraSecretKey = "7e9c3d4a2b1f8e6d9c0b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d"; // Chave secreta fictícia

    private readonly platformId = inject(PLATFORM_ID);
    private readonly browser = isPlatformBrowser(this.platformId);

    private getSessionData(): UserTokenModel | null {
        if (!this.browser) return null;

        const session = localStorage.getItem(this.sessionKey);
        if (!session) return null;

        try {
            return JSON.parse(session) as UserTokenModel;
        } catch {
            return null;
        }
    }

    private saveSessionData(userPayload: UserTokenModel): void {
        if (!this.browser) return;
        localStorage.setItem(this.sessionKey, JSON.stringify(userPayload));
    }

    private clearSessionData(): void {
        if (!this.browser) return;
        localStorage.removeItem(this.sessionKey);
    }

    private createToken(payload: UserTokenModel): string{
        const header = {
            alg: "HS256", // aLg: Algoritmo usado para a criptografia do token
            typ: "JWT" // Type: JWT
        };

        // codificando header e payload em base64
        const encHeader = btoa(JSON.stringify(header).toString());
        const encPayload = btoa(JSON.stringify(payload)); //btoa codifica para base64 e 

        const tokenData = `${encHeader}.${encPayload}`;
        const signature = crypt.HmacSHA256(tokenData, this.ultraSecretKey).toString(crypt.enc.Base64url); // Criptografia em Sha256.
        
        return `${tokenData}.${signature}`;
    }
    
    // Recupera o cookie e pega só o token.
    private getToken(): string | null{
        if(!this.browser) return null;
        const cookie = document.cookie.trim().split(';').find((c) => c.startsWith(`${this.key}=`));
        
        return cookie ? cookie.substring(`${this.key}=`.length) : null;
    }
    
    private tokenData(): UserTokenModel | null{
        const token = this.getToken();
        if (token && this.checkToken()) {
            const payload = token.split('.')[1];
            return JSON.parse(atob(payload));
        }

        return this.getSessionData();
    }

    getId(): string{
        return this.tokenData()?.id ?? '';
    }
    getName(): string{
        return this.tokenData()?.name ?? '';
    }
    getEmail(): string{
        return this.tokenData()?.email ?? '';
    }

    // Sobe o cookie.
    setToken(userPayload: UserTokenModel): void{
        if(!this.browser) return;

        const token = this.createToken(userPayload);
        document.cookie = `${this.key}=${token}; max-age=${this.maxAge}; path=/; SameSite=Strict`;
        this.saveSessionData(userPayload);
    }

    // Verifica se o token não foi modificado.
    checkToken(): boolean {
        const token = this.getToken();
        if(!this.browser) return false;

        if (token) {
            const [tokenHeader, tokenPayload, signature] = token.toString().split('.');
            if (!tokenHeader || !tokenPayload || !signature) return false;
            const tokenData = `${tokenHeader}.${tokenPayload}`;
            const newSignature = crypt.HmacSHA256(tokenData, this.ultraSecretKey).toString(crypt.enc.Base64url);
            if (newSignature !== signature) return false;
            return true;
        }

        return !!this.getSessionData();
    }

    // Deleta o cookie.
    deleteToken(): void {
        if(!this.browser) return;
        document.cookie = `${this.key}=; max-age=0; path=/; SameSite=Strict`;
        this.clearSessionData();
    }

}
