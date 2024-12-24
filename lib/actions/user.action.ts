'use server';

import { ID, Query } from "node-appwrite";
import { createAdminClient } from "../appwrite";
import { appwriteConfig } from "../appwrite/config";
import { parseStringify } from "../utils";

const getUserByEmail = async(email: string) =>{
    const {databases} = await createAdminClient();
    const result = await databases.listDocuments(
        appwriteConfig.databaseId,
        appwriteConfig.usersCollectionId,
        [Query.equal("email", [email])],
    );
    return result.total > 0 ? result.documents[0] : null;
};

const handleError = (error: unknown ,message: string) => {
    console.error(error);
    throw error;
}
const sendEmailOTP = async ({ email}: { email: string }) =>{  
    const {account} = await createAdminClient();
    try{
      const session = await account.createEmailToken(ID.unique(),email);
      return session.userId;
    }
    catch(error) {
        handleError(error, "Failed to send email OTP");
    }

}

export const createAccount = async ({
    fullName,
    email,
}:{
    fullName: string,
    email: string,
}) =>{
  const existingUser = await getUserByEmail(email);

  const accountId  = await sendEmailOTP({email});
  if(!accountId) throw new Error("Failed to create send OTP");
  if(!existingUser) {
    const {databases} = await createAdminClient();
    const result = await databases.createDocument(
        appwriteConfig.databaseId,
        appwriteConfig.usersCollectionId,
        ID.unique(),
       {
        fullName,
        email,
        avatar: "https://t4.ftcdn.net/jpg/05/49/98/39/360_F_549983970_bRCkYfk0P6PP5fKbMhZMIb07mCJ6esXL.jpg",
        accountId,
       }
    );
  }
  return parseStringify({accountId})
}