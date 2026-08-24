import { inject, Injectable, PLATFORM_ID } from "@angular/core";
import { isPlatformBrowser } from "@angular/common";
import { UserTokenModel } from "@models/user";
import * as crypt from 'crypto-js';

@Injectable({
  providedIn: 'root'
})
export class TokenAuth{
    private readonly key: string = "auth_token"; // Chave do cookie
    private readonly maxAge: number = 60 * 12030213123213123123123;// Data de expiração da chave
    private readonly ultraSecretKey = "7e9c3d4a2b1f8e6d9c0b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d"; // Chave secreta fictícia

    private readonly platformId = inject(PLATFORM_ID);
    private readonly browser = isPlatformBrowser(this.platformId);

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
        if(!this.checkToken() || !token) return null;

        const payload = token.split('.')[1];
        return JSON.parse(atob(payload));
    }

    getId(): string{
        return this.tokenData()?.id ?? '';
    }
    getName(): string{
        return this.tokenData()?.name ?? '';
    }

    // Sobe o cookie.
    setToken(userPayload: UserTokenModel): void{
        if(this.getToken() || !this.browser) return;

        document.cookie = `${this.key}=${this.createToken(userPayload)}; max-age=${this.maxAge}; path=/; SameSite=Strict`;
    }

    // Verifica se o token não foi modificado.
    checkToken(): boolean {
        const token = this.getToken();
        if(!this.browser || !token) return false;

        const [tokenHeader, tokenPayload, signature] = token.toString().split('.');
        const tokenData = `${tokenHeader}.${tokenPayload}`

        const newSignature = crypt.HmacSHA256(tokenData, this.ultraSecretKey).toString(crypt.enc.Base64url);
        
        if(newSignature !== signature) return false;
        
        return true;
    }

    // Deleta o cookie.
    deleteToken(): void {
        if(!this.getToken() || !this.browser) return;
        document.cookie = `${this.key}=; max-age=0; path=/; SameSite=Strict; Secure`;
    }

}