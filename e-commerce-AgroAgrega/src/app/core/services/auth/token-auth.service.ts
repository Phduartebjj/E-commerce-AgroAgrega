export class TokenAuth{
    createToken(payload: string): string{
        const header = {
            alg: "none",
            typ: "JWT"
        };

        return `${btoa(JSON.stringify(header))}.${JSON.stringify(payload)}.picles`
    }

    setToken(token: string){
        document.cookie = `cookie_user=${token}`;
    }

    deleteToken(): void{
        document.cookie = `cookie_user=""`;
    }

}