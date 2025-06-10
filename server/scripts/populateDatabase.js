const axios = require("axios");
const signupApi = "http://localhost:4000/admin/users"; // URL corrigée

const users = [
  {
    firstName: "Tony",
    lastName: "Stark",
    email: "tony.stark@avengers.com",
    password: "ironman123",
    address: "10880 Malibu Point, Malibu, CA",
    phoneNumber: "1234567890",
    role: "admin",
  },
  {
    firstName: "Steve",
    lastName: "Rogers",
    email: "steve.rogers@avengers.com",
    password: "captain123",
    address: "569 Leaman Place, Brooklyn, NY",
    phoneNumber: "0987654321",
    role: "user",
  },
];

const populateDatabase = async () => {
  try {
    const results = await Promise.all(
      users.map(async (user) => {
        try {
          const response = await axios.post(signupApi, user);
          console.log(
            `User ${user.firstName} ${user.lastName} created successfully:`,
            response.data
          );
        } catch (error) {
          console.error(
            `Error creating user ${user.firstName} ${user.lastName}:`,
            error.response?.data || error.message
          );
        }
      })
    );
    console.log("✅ All users processed successfully.");
  } catch (error) {
    console.error("❌ Error populating database:", error.message);
  }
};

populateDatabase();
