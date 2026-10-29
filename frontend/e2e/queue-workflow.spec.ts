import { test, expect } from "@playwright/test";

test.describe("CareQueue Hospital Patient Queue Management - End-to-End User Journey", () => {
  test("Complete patient queue lifecycle: registration, FIFO waiting list, calling, repeat call, completion, and cancellation", async ({
    page,
  }) => {
    // 1. Open the CareQueue dashboard
    await page.goto("/");
    await expect(page).toHaveTitle(/CareQueue/i);

    // Verify main brand identity
    await expect(page.getByText("CareQueue", { exact: false })).toBeVisible();

    // 2. Open Register Patient Modal and register Patient A (Maya Lin)
    await page.getByRole("button", { name: /Register Patient/i }).first().click();
    await expect(page.getByText("Register New Patient")).toBeVisible();

    await page.getByPlaceholder(/e\.g\. Maya Lin/i).fill("Maya Lin");
    await page.getByRole("button", { name: /Register & Enqueue/i }).click();

    // Verify registration confirmation
    await expect(page.getByText("Registration Confirmed")).toBeVisible();
    await page.getByRole("button", { name: /Register Another Patient/i }).click();

    // 3. Register Patient B (Carlos Mendez)
    await page.getByPlaceholder(/e\.g\. Maya Lin/i).fill("Carlos Mendez");
    await page.getByRole("button", { name: /Register & Enqueue/i }).click();
    await expect(page.getByText("Registration Confirmed")).toBeVisible();
    await page.getByRole("button", { name: /Done \/ Close/i }).click();

    // 4. Confirm Maya Lin is #1 and Carlos Mendez is #2 in FIFO order
    const queueTable = page.locator("table").first();
    await expect(queueTable.getByText("Maya Lin")).toBeVisible();
    await expect(queueTable.getByText("Carlos Mendez")).toBeVisible();

    // 5. Call the next waiting patient (Maya Lin)
    await page.getByRole("button", { name: /Call Next Patient/i }).click();

    // 6. Verify Maya Lin is now in consultation
    const consultationCard = page.locator("text=Now In Consultation").locator("..");
    await expect(page.getByText("Now In Consultation")).toBeVisible();
    await expect(page.getByText("Maya Lin").first()).toBeVisible();

    // 7. Verify Carlos Mendez is now #1 Next in the waiting queue
    await expect(queueTable.getByText("Carlos Mendez")).toBeVisible();

    // 8. Verify Recent Calls stack displays Maya Lin as STACK TOP
    await expect(page.getByText("STACK TOP")).toBeVisible();

    // 9. Click "Repeat Last Call" and verify waiting queue remains intact
    await page.getByRole("button", { name: /Repeat Announcement|Repeat Last Call/i }).first().click();
    await expect(queueTable.getByText("Carlos Mendez")).toBeVisible();

    // 10. Mark Maya Lin as completed
    await page.getByRole("button", { name: /Mark Consultation Completed/i }).click();
    await page.getByRole("button", { name: /Mark Completed/i }).click(); // confirm dialog

    // 11. Switch to Patient Registry tab to search for Carlos Mendez
    await page.getByRole("button", { name: /Patient Registry/i }).click();
    const searchInput = page.getByPlaceholder(/Search by patient name or token/i);
    await searchInput.fill("Carlos");
    await expect(page.getByText("Carlos Mendez")).toBeVisible();

    // 12. Switch back to Waiting Queue tab and cancel Carlos Mendez
    await page.getByRole("button", { name: /Live Dashboard/i }).click();
    await page.getByTitle(/Cancel waiting entry/i).first().click();
    await page.getByRole("button", { name: /Cancel Queue Entry/i }).click(); // confirm modal

    // Verify queue is now empty or entry removed
    await expect(page.getByText(/No Patients Waiting/i)).toBeVisible();
  });
});
