import project_model from "../db/models/project_model.js";
import usermodel from "../db/models/user_model.js";

// Function to create a new user
export async function createuser({ firstname, lastname, email, password, confirmpassword }) {

    // Basic validation: required fields
    if (!email || !password || !firstname) {
        throw new Error('All details must be present');
    }

    // Check if password and confirm password match
    if (password !== confirmpassword) {
        throw new Error('password and confirm password must be same');
    }

    // Create user with hashed password
    const user = await usermodel.create({
        firstname,
        lastname,
        email,
        password: await usermodel.hashpassword(password) // hashing password before saving
    });

    return user;
}


// Function to login a user
export async function loginuser({ email, password }) {
    try {
        // Find user and explicitly include password field
        const user = await usermodel.findOne({ email: email }).select("+password");

        // If user not found
        if (!user) {
            throw new Error("Invalid credentials");
        }

        // Compare entered password with stored hashed password
        const isMatch = await user.isvalidpassword(password);

        if (!isMatch) {
            throw new Error("Invalid credentials");
        }

        // Return user if login successful
        return user;

    } catch (err) {
        // Return error in structured format
        return { status: "error", message: err.message };
    }
}


// Function for Google OAuth users
export async function googleuser(email, firstname, lastname) {
    try {
        // Check if user already exists
        const user = await usermodel.findOne({ email });

        if (user) {
            // If exists, return existing user
            return user;
        } else {
            // Else create a new user with default password
            const newuser = await usermodel.create({
                firstname,
                lastname,
                email,
                password: 'googleuser' // ⚠️ not secure, should ideally be random/unused
            });

            return newuser;
        }

    } catch (error) {
        return { status: "error", message: error.message };
    }
}


// Get all users except a specific user ID
export const allusersexceptid = async ({ user_id }) => {
    try {
        // Find all users where _id is NOT equal to user_id
        const allusers = await usermodel.find({ _id: { $ne: user_id } });

        return { status: "success", allusers };

    } catch (error) {
        return { status: "error", message: error.message };
    }
};


// Get all users who are NOT part of a specific project
export const allusersExceptInProjectid = async ({ project_id }) => {
    console.log(project_id);

    try {
        // Find the project by ID
        let project = await project_model.findOne({ _id: project_id });

        // If project not found
        if (!project) {
            return { status: "error", message: "Project not found" };
        }

        // Get all users
        let allusers = await usermodel.find({});

        let reqUsers = [];

        // Filter users not present in project.users
        allusers.map((user) => {
            let ff = false;

            // Check if user exists in project users
            project.users.map((projectuser) => {
                if (projectuser.toString() == user._id.toString()) {
                    ff = true;
                }
            });

            // If not part of project, add to result
            if (!ff) reqUsers.push(user);
        });

        // Replace allusers with filtered users
        allusers = reqUsers;

        return { status: "success", allusers };

    } catch (error) {
        return { status: "error", message: error.message };
    }
};