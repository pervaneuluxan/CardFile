import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from "mongodb";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { initilazeUserBoard } from "../init-user-board";

// Secrets come from the environment only (.env.local in development; see .env.example).
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not set. Copy .env.example to .env.local and fill it in.");
}
if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error("BETTER_AUTH_SECRET is not set. Copy .env.example to .env.local and fill it in.");
}

const client = new MongoClient(MONGODB_URI);
const db = client.db();

export const auth = betterAuth({
    database: mongodbAdapter(db, {
        client

    }),
    session:{
        cookieCache:{
            enabled:true,
            maxAge:60 * 60
        }
    },
    emailAndPassword:{
        enabled:true
    },
    databaseHooks:{
        user:{
            create:{
                after:async (user)=>{
                    if(user.id){
                        await initilazeUserBoard(user.id)
                    }
                   
                }
            }
        }
    }

});

export async function getSession() {
    const result= await auth.api.getSession({
        headers:await headers()
    })

    return result;
    
}

export async function signOut() {
    const result= await auth.api.signOut({
        headers:await headers()
    })

    if(result.success){
        redirect('/signin')
    }

    return result;
    
}