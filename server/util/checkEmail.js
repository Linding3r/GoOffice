export async function doesEmailExist(email) {
    const [results] = await db.promise().query(`SELECT * FROM users WHERE email = ?;`, [email]);
    return results.length > 0;
}