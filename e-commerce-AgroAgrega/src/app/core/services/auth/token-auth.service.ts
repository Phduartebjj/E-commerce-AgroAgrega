import { Injectable } from "@angular/core";
import { UserModel } from "@models/user";
import * as crypt from 'crypto-js';

@Injectable({
  providedIn: 'root'
})
export class TokenAuth{
    private readonly key: string = "auth_token";
    private readonly maxAge: number = 20;
    private readonly ultraSecretKey = "7e9c3d4a2b1f8e6d9c0b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d";

    private createToken(payload: UserModel): string{
        const header = {
            alg: "HS256",
            typ: "JWT"
        };

        const encHeader = btoa(JSON.stringify(header));
        const encPayload = btoa(JSON.stringify(payload));

        const tokenData = `${encHeader}.${encPayload}`;
        const signature = crypt.HmacSHA256(tokenData, this.ultraSecretKey).toString();

        return `${tokenData}.${signature}`;
    }

    setToken(userPayload: UserModel){
        document.cookie = `${this.key}=${this.createToken(userPayload)}; max-age=${this.maxAge}; path=/; SameSite=Strict; Secure`;
    }

    private getToken(): string | null{
        const cookie = document.cookie
        .split('; ')
        .find((c) => c.startsWith(`${this.key}=`));

        return cookie ? cookie.split('=')[1] : null;
    }

    checkToken(): boolean {
        return false;
    }

    deleteToken(): void {
        document.cookie = `${this.key}=; max-age=0; path=/; SameSite=Strict; Secure`;
    }

}