import { Injectable } from "@angular/core";
import { UserModel } from "@models/user";
import * as crypt from 'crypto-js';

@Injectable({
  providedIn: 'root'
})
export class TokenAuth{
    private readonly key: string = "auth_token"; // Chave do cookie
    private readonly maxAge: number = 60 * 2;// Data de expiração da chave
    private readonly ultraSecretKey = "7e9c3d4a2b1f8e6d9c0b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d"; // Chave secreta fictícia

    private createToken(payload: UserModel): string{
        const header = {
            alg: "HS256", // aLg: Algoritmo usado para a criptografia do token
            typ: "JWT" // Type: JWT
        };

        // codificando header e payload em base64
        const encHeader = btoa(JSON.stringify(header)); 
        const encPayload = btoa(JSON.stringify(payload)); //btoa codifica para base64 e 

        const tokenData = `${encHeader}.${encPayload}`;
        const signature = crypt.HmacSHA256(tokenData, this.ultraSecretKey).toString(); // Criptografia em Sha256.

        return `${tokenData}.${signature}`;
    }

    // Sobe o cookie.
    setToken(userPayload: UserModel){
        document.cookie = `${this.key}=${this.createToken(userPayload)}; max-age=${this.maxAge}; path=/; SameSite=Strict; Secure`;
    }

    // Recupera o cookie e pega só o token.
    private getToken(): string | null{
        const cookie = document.cookie.trim().split(';').find((c) => c.startsWith(`${this.key}=`));
       
        return cookie ? cookie.substring(`${this.key}=`.length) : null;
    }

    // Verifica se o token não foi modificado.
    checkToken(): boolean {
        const token = this.getToken();
        if(!token) return false;

        console.log(token);
        

        const [tokenHeader, tokenPayload, signature] = token?.toString().split('.');
        const tokenData = `${tokenHeader}.${tokenPayload}`

        const newSignature = crypt.HmacSHA256(tokenData, this.ultraSecretKey).toString();
        
        if(newSignature !== signature) return false;
        
        return true;
    }

    // Deleta o cookie.
    deleteToken(): void {
        document.cookie = `${this.key}=; max-age=0; path=/; SameSite=Strict; Secure`;
    }

}