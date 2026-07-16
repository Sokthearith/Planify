import bcrypt from "bcrypt";
import { sequelize, User } from "./models/index.js";

const BATCH = 10000;

async function seed() {
  await sequelize.sync({ force: true });

  const hash = await bcrypt.hash("Password123!", 10);

  console.time("seed");

  for (let batch = 0; batch < 100; batch++) {
    const userData = [];
    for (let i = 1; i <= BATCH; i++) {
      const n = batch * BATCH + i;
      userData.push({
        name: `User${n}`,
        email: `user${n}@gmail.com`,
        password: hash,
      });
    }
    await User.bulkCreate(userData);
    console.log(`Users: ${(batch + 1) * BATCH}/${1000000}`);
  }

  console.timeEnd("seed");
  console.log("Seed complete!");
  await sequelize.close();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
