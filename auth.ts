import NextAuth from "next-auth";
import {PrismaAdapter} from "@auth/prisma-adapter";
import { db } from "./lib/db";
import authConfig from "./auth.config";
import { getUserById, getAccountByUserId } from "./features/auth/actions";


export const {auth, handlers, signIn, signOut} = NextAuth({
    callbacks:{
    async signIn({user,account}){
    if(!user?.email||!account){
        return false;
    }
    const email = user.email;
    //check if user exists
    const exisitingUser = await db.user.findUnique({
        where:{
            email,
        },
    });
    if(!exisitingUser){
        const newUser=await db.user.create({
            data:{
                email,
                name:user.name,
                image:user.image,
                accounts:{
                    create:{
                        type:account.type,
                        provider:account.provider,
                        providerAccountId:account.providerAccountId,
                        access_token:account.access_token,
                        refresh_token:account.refresh_token,
                        expires_at:account.expires_at,
                    },
                },
            },
        });
        if(!newUser){
            return false;
        }
        return true;
    }
    else{
        const existingAccount=await db.account.findUnique({
            where:{
                provider_providerAccountId:{
                    provider:account.provider,
                    providerAccountId:account.providerAccountId,
                },
            },
        });
        if(!existingAccount){
            const newAccount=await db.account.create({
                data:{
                    userId:exisitingUser.id,
                    type:account.type,
                    provider:account.provider,
                    providerAccountId:account.providerAccountId,
                    access_token:account.access_token,
                    refresh_token:account.refresh_token,
                    expires_at:account.expires_at,
                    token_type:account.token_type,
                    scope:account.scope,
                    id_token:account.id_token,
                    session_state:typeof account.session_state === "string" ? account.session_state : null,

                },
            });
            if(!newAccount){
                return false;
            }
            return true;
        }
        return true;
    }
},
    async jwt({token,user,account}){
        if(!token.sub) return token;

        const exisitingUser=await getUserById(token.sub);

        if(!exisitingUser){
            return token;
        }
        const exisitingAccount=await getAccountByUserId(exisitingUser.id);

        token.name=exisitingUser.name;
        token.email=exisitingUser.email;
        token.role=exisitingUser.role;

        return token;
},
    async session({session,token}){
        if(token.sub && session.user){
            session.user.id=token.sub;
        }
        if(token.sub && session.user){
            session.user.role=token.role;
        }
        return session;
    }
} ,
    adapter:PrismaAdapter(db),
    session:{
        strategy:'jwt',
    },
    ...authConfig
});
