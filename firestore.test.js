const {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} = require("@firebase/rules-unit-testing");
const { test, before, after, beforeEach } = require("node:test");
const fs = require("node:fs");

let testEnv;
const PROJECT_ID = "demo-no-project";
const ALICE_UID = "alice_123";
const BOB_UID = "bob_456";
const ADMIN_UID = "admin_999";

const [emulatorHost, emulatorPortStr] = (process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8085").split(":");
const emulatorPort = parseInt(emulatorPortStr, 10);

before(async () => {
  const rules = fs.readFileSync("./firestore.rules", "utf8");
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules,
      host: emulatorHost,
      port: emulatorPort,
    },
  });
});

after(async () => {
  if (testEnv) {
    await testEnv.cleanup();
  }
});

beforeEach(async () => {
  if (testEnv) {
    await testEnv.clearFirestore();
  }
});

test("Unauthenticated user cannot read categories or users", async () => {
  const unauthDb = testEnv.unauthenticatedContext().firestore();
  await assertFails(unauthDb.collection("categories").get());
  await assertFails(unauthDb.collection("users").doc(ALICE_UID).get());
});

test("Authenticated user can read categories and their own profile", async () => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await context.firestore().collection("users").doc(ALICE_UID).set({
      id: ALICE_UID,
      name: "Alice",
      role: "CUSTOMER",
    });
    await context.firestore().collection("categories").doc("plumbing").set({
      id: "plumbing",
      name: "Plumbing",
    });
  });

  const aliceDb = testEnv.authenticatedContext(ALICE_UID).firestore();
  await assertSucceeds(aliceDb.collection("categories").doc("plumbing").get());
  await assertSucceeds(aliceDb.collection("users").doc(ALICE_UID).get());
});

test("Customer can create a booking with their own customerId", async () => {
  const aliceDb = testEnv.authenticatedContext(ALICE_UID).firestore();
  await assertSucceeds(
    aliceDb.collection("bookings").doc("booking_1").set({
      id: "booking_1",
      customerId: ALICE_UID,
      subServiceName: "Leak Repair",
      taskPrice: 299,
      status: "REQUESTED",
    })
  );
});

test("Customer cannot create a booking with Bob's customerId", async () => {
  const aliceDb = testEnv.authenticatedContext(ALICE_UID).firestore();
  await assertFails(
    aliceDb.collection("bookings").doc("booking_2").set({
      id: "booking_2",
      customerId: BOB_UID,
      subServiceName: "Leak Repair",
      taskPrice: 299,
      status: "REQUESTED",
    })
  );
});

test("Customer can read their own booking but not Bob's booking", async () => {
  await testEnv.withSecurityRulesDisabled(async (context) => {
    await context.firestore().collection("bookings").doc("bob_booking").set({
      id: "bob_booking",
      customerId: BOB_UID,
      status: "REQUESTED",
    });
  });

  const aliceDb = testEnv.authenticatedContext(ALICE_UID).firestore();
  await assertFails(aliceDb.collection("bookings").doc("bob_booking").get());
});
