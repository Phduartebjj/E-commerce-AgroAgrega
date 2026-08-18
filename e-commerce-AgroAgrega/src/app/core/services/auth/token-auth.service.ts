import { Injectable } from "@angular/core";
import { UserModel } from "@models/user";

@Injectable({
  providedIn: 'root'
})
export class TokenAuth{
    private createToken(payload: UserModel): string{
        const header = {
            alg: "none",
            typ: "JWT"
        };

        return `${btoa(JSON.stringify(header))}.${JSON.stringify(payload)}.picles`
    }

    setToken(userPayload: UserModel){
        document.cookie = `cookie_user=${this.createToken(userPayload)}`;
    }

    getToken(){
        return document.cookie;
    }

    deleteToken(): void {
        document.cookie = `cookie_user=""`;
    }

}