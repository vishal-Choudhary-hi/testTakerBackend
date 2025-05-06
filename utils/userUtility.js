let userData = null;

const setUserData = (user_data) => {
    userData = user_data
}
const getUserData = () => {
    return userData
}
module.exports = { setUserData, getUserData }