import bcrypt from "bcrypt"

const saltRounds = 14;


export async function passwordHasher(plainTextPassword){
    try{
        return await bcrypt.hash(plainTextPassword, saltRounds)
    } catch (e){
        console.log(e)
    }
}

export async function checkPassword(enteredPassword, savedHashedPassword ){
    try {
        return await bcrypt.compare(enteredPassword, savedHashedPassword)
    } catch (e){
        console.log(e)
    }
}


