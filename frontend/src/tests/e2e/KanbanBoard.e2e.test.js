import { test, expect } from "@playwright/test";

test.describe("Kanban Board E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Reset tasks before each test
    await fetch("http://localhost:5000/api/tasks/reset", { method: "POST" });
    await page.goto("http://localhost:3000");
    await page.waitForLoadState("networkidle");
  });

  test("User can create a task and see it on the board", async ({ page }) => {
    // Wait for board to load
    await expect(page.getByText("Real-time Kanban Board")).toBeVisible();
    await expect(page.getByText("To Do")).toBeVisible();

    // Click add task button in "To Do" column
    await page.locator(".kanban-column").first().getByText("+ Add Task").click();

    // Fill out the form
    await expect(page.getByText("Create New Task")).toBeVisible();
    await page.getByPlaceholder("Enter task title").fill("E2E Test Task");
    await page.getByPlaceholder("Enter task description").fill("This is an E2E test task");

    // Submit the form
    await page.getByText("Create Task").click();

    // Verify task appears on the board
    await expect(page.getByText("E2E Test Task")).toBeVisible();
    await expect(page.getByText("This is an E2E test task")).toBeVisible();
  });

  test("User can edit a task", async ({ page }) => {
    // First create a task
    await page.locator(".kanban-column").first().getByText("+ Add Task").click();
    await page.getByPlaceholder("Enter task title").fill("Task to Edit");
    await page.getByText("Create Task").click();
    
    await expect(page.getByText("Task to Edit")).toBeVisible();

    // Click edit button
    await page.getByTitle("Edit task").click();

    // Modify the task
    await expect(page.getByText("Edit Task")).toBeVisible();
    const titleInput = page.getByDisplayValue("Task to Edit");
    await titleInput.clear();
    await titleInput.fill("Edited Task");
    
    await page.getByText("Update Task").click();

    // Verify changes
    await expect(page.getByText("Edited Task")).toBeVisible();
    await expect(page.getByText("Task to Edit")).not.toBeVisible();
  });

  test("User can delete a task", async ({ page }) => {
    // Create a task
    await page.locator(".kanban-column").first().getByText("+ Add Task").click();
    await page.getByPlaceholder("Enter task title").fill("Task to Delete");
    await page.getByText("Create Task").click();
    
    await expect(page.getByText("Task to Delete")).toBeVisible();

    // Delete the task
    page.on("dialog", dialog => dialog.accept());
    await page.getByTitle("Delete task").click();

    // Verify task is removed
    await expect(page.getByText("Task to Delete")).not.toBeVisible();
  });

  test("User can drag and drop task from To Do to In Progress", async ({ page }) => {
    // Create a task in To Do
    await page.locator(".kanban-column").first().getByText("+ Add Task").click();
    await page.getByPlaceholder("Enter task title").fill("Drag Me");
    await page.getByText("Create Task").click();
    
    await expect(page.getByText("Drag Me")).toBeVisible();

    // Get source and target elements
    const taskCard = page.getByText("Drag Me").locator("..");
    const inProgressColumn = page.locator(".kanban-column").nth(1);

    // Perform drag and drop
    await taskCard.dragTo(inProgressColumn);

    // Wait a moment for the WebSocket sync
    await page.waitForTimeout(500);

    // Verify task moved to In Progress column
    const inProgressTasks = inProgressColumn.locator(".task-card");
    await expect(inProgressTasks.getByText("Drag Me")).toBeVisible();
  });

  test("User can drag and drop task from In Progress to Done", async ({ page }) => {
    // Create a task in In Progress
    await page.locator(".kanban-column").nth(1).getByText("+ Add Task").click();
    await page.getByPlaceholder("Enter task title").fill("Complete Me");
    await page.getByText("Create Task").click();
    
    await expect(page.getByText("Complete Me")).toBeVisible();

    // Drag to Done column
    const taskCard = page.getByText("Complete Me").locator("..").locator("..");
    const doneColumn = page.locator(".kanban-column").nth(2);

    await taskCard.dragTo(doneColumn);
    await page.waitForTimeout(500);

    // Verify task is in Done column
    const doneTasks = doneColumn.locator(".task-card");
    await expect(doneTasks.getByText("Complete Me")).toBeVisible();
  });
});

test.describe("Priority and Category Selection", () => {
  test.beforeEach(async ({ page }) => {
    await fetch("http://localhost:5000/api/tasks/reset", { method: "POST" });
    await page.goto("http://localhost:3000");
    await page.waitForLoadState("networkidle");
  });

  test("User can select priority level", async ({ page }) => {
    await page.locator(".kanban-column").first().getByText("+ Add Task").click();
    await page.getByPlaceholder("Enter task title").fill("High Priority Task");

    // Click on priority dropdown
    await page.locator(".react-select-container").first().click();
    await page.getByText("High Priority").click();

    await page.getByText("Create Task").click();

    // Verify priority badge
    await expect(page.locator(".priority-badge.High")).toBeVisible();
    await expect(page.locator(".priority-badge.High")).toHaveText("High");
  });

  test("User can change task category", async ({ page }) => {
    await page.locator(".kanban-column").first().getByText("+ Add Task").click();
    await page.getByPlaceholder("Enter task title").fill("Bug Fix Task");

    // Select Bug category
    await page.locator(".react-select-container").nth(1).click();
    await page.getByText("Bug", { exact: true }).click();

    await page.getByText("Create Task").click();

    // Verify category badge
    await expect(page.locator(".category-badge.Bug")).toBeVisible();
    await expect(page.locator(".category-badge.Bug")).toHaveText("Bug");
  });

  test("Priority badge displays correct color", async ({ page }) => {
    // Create low priority task
    await page.locator(".kanban-column").first().getByText("+ Add Task").click();
    await page.getByPlaceholder("Enter task title").fill("Low Priority");
    await page.locator(".react-select-container").first().click();
    await page.getByText("Low Priority").click();
    await page.getByText("Create Task").click();

    const lowBadge = page.locator(".priority-badge.Low");
    await expect(lowBadge).toBeVisible();
  });
});

test.describe("File Upload", () => {
  test.beforeEach(async ({ page }) => {
    await fetch("http://localhost:5000/api/tasks/reset", { method: "POST" });
    await page.goto("http://localhost:3000");
    await page.waitForLoadState("networkidle");
  });

  test("User can upload an image file", async ({ page }) => {
    await page.locator(".kanban-column").first().getByText("+ Add Task").click();
    await page.getByPlaceholder("Enter task title").fill("Task with Image");

    // Upload an image (create a dummy file)
    const fileInput = page.locator("#file-input");
    await fileInput.setInputFiles({
      name: "test-image.png",
      mimeType: "image/png",
      buffer: Buffer.from("fake-image-data")
    });

    // Wait for preview to appear
    await page.waitForTimeout(500);
    await expect(page.locator(".file-preview img")).toBeVisible();

    await page.getByText("Create Task").click();

    // Verify attachment is shown on task card
    await expect(page.locator(".attachment-preview")).toBeVisible();
  });

  test("User can upload a PDF file", async ({ page }) => {
    await page.locator(".kanban-column").first().getByText("+ Add Task").click();
    await page.getByPlaceholder("Enter task title").fill("Task with PDF");

    const fileInput = page.locator("#file-input");
    await fileInput.setInputFiles({
      name: "document.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("fake-pdf-data")
    });

    await page.waitForTimeout(500);
    await expect(page.getByText("document.pdf")).toBeVisible();

    await page.getByText("Create Task").click();

    // Verify PDF attachment is shown
    await expect(page.locator(".attachment-file")).toBeVisible();
  });

  test("Invalid file type shows error message", async ({ page }) => {
    await page.locator(".kanban-column").first().getByText("+ Add Task").click();
    await page.getByPlaceholder("Enter task title").fill("Invalid File");

    const fileInput = page.locator("#file-input");
    await fileInput.setInputFiles({
      name: "virus.exe",
      mimeType: "application/x-msdownload",
      buffer: Buffer.from("fake-exe")
    });

    await page.waitForTimeout(500);
    await expect(page.getByText(/Invalid file type/i)).toBeVisible();
  });

  test("File size exceeding 5MB shows error", async ({ page }) => {
    await page.locator(".kanban-column").first().getByText("+ Add Task").click();
    await page.getByPlaceholder("Enter task title").fill("Large File");

    // Create a buffer larger than 5MB
    const largeBuffer = Buffer.alloc(6 * 1024 * 1024);
    
    const fileInput = page.locator("#file-input");
    await fileInput.setInputFiles({
      name: "large-image.png",
      mimeType: "image/png",
      buffer: largeBuffer
    });

    await page.waitForTimeout(500);
    await expect(page.getByText(/File too large/i)).toBeVisible();
  });

  test("Uploaded files display correctly on task card", async ({ page }) => {
    await page.locator(".kanban-column").first().getByText("+ Add Task").click();
    await page.getByPlaceholder("Enter task title").fill("Multi-file Task");

    const fileInput = page.locator("#file-input");
    await fileInput.setInputFiles([
      {
        name: "image1.png",
        mimeType: "image/png",
        buffer: Buffer.from("image1")
      },
      {
        name: "image2.jpg",
        mimeType: "image/jpeg",
        buffer: Buffer.from("image2")
      }
    ]);

    await page.waitForTimeout(500);
    await page.getByText("Create Task").click();

    // Verify multiple attachments
    const attachments = page.locator(".attachment-preview");
    await expect(attachments).toHaveCount(2);
  });
});

test.describe("Task Progress Chart", () => {
  test.beforeEach(async ({ page }) => {
    await fetch("http://localhost:5000/api/tasks/reset", { method: "POST" });
    await page.goto("http://localhost:3000");
    await page.waitForLoadState("networkidle");
  });

  test("Chart displays on page load", async ({ page }) => {
    await expect(page.getByText("Task Progress Overview")).toBeVisible();
    await expect(page.getByText("Task Distribution")).toBeVisible();
    await expect(page.getByText("Completion Status")).toBeVisible();
  });

  test("Task count updates when task is created", async ({ page }) => {
    // Check initial state
    await expect(page.getByText("0 total tasks")).toBeVisible();

    // Create a task
    await page.locator(".kanban-column").first().getByText("+ Add Task").click();
    await page.getByPlaceholder("Enter task title").fill("Chart Test");
    await page.getByText("Create Task").click();

    // Verify chart updates
    await expect(page.getByText("1 total tasks")).toBeVisible();
  });

  test("Task count updates when task is moved", async ({ page }) => {
    // Create a task in To Do
    await page.locator(".kanban-column").first().getByText("+ Add Task").click();
    await page.getByPlaceholder("Enter task title").fill("Move Me");
    await page.getByText("Create Task").click();
    
    await expect(page.getByText("0% completed")).toBeVisible();

    // Move to Done
    const taskCard = page.getByText("Move Me").locator("..").locator("..");
    const doneColumn = page.locator(".kanban-column").nth(2);
    await taskCard.dragTo(doneColumn);
    
    await page.waitForTimeout(500);

    // Verify completion percentage updated
    await expect(page.getByText("100% completed")).toBeVisible();
  });

  test("Completion percentage updates correctly", async ({ page }) => {
    // Create 3 tasks in To Do
    for (let i = 1; i <= 3; i++) {
      await page.locator(".kanban-column").first().getByText("+ Add Task").click();
      await page.getByPlaceholder("Enter task title").fill(`Task ${i}`);
      await page.getByText("Create Task").click();
      await page.waitForTimeout(200);
    }

    // Move one task to Done
    const taskCard = page.getByText("Task 1").locator("..").locator("..");
    const doneColumn = page.locator(".kanban-column").nth(2);
    await taskCard.dragTo(doneColumn);
    await page.waitForTimeout(500);

    // 1 out of 3 = 33%
    await expect(page.getByText("33% completed")).toBeVisible();
  });
});

test.describe("Real-time Multi-Client Sync", () => {
  test("Task created in one browser appears in another", async ({ browser }) => {
    await fetch("http://localhost:5000/api/tasks/reset", { method: "POST" });

    // Open two browser contexts
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    await page1.goto("http://localhost:3000");
    await page2.goto("http://localhost:3000");

    await page1.waitForLoadState("networkidle");
    await page2.waitForLoadState("networkidle");

    // Create task in page1
    await page1.locator(".kanban-column").first().getByText("+ Add Task").click();
    await page1.getByPlaceholder("Enter task title").fill("Synced Task");
    await page1.getByText("Create Task").click();

    // Verify task appears in both pages
    await expect(page1.getByText("Synced Task")).toBeVisible();
    await expect(page2.getByText("Synced Task")).toBeVisible({ timeout: 3000 });

    await context1.close();
    await context2.close();
  });

  test("Task moved in one browser updates in another", async ({ browser }) => {
    await fetch("http://localhost:5000/api/tasks/reset", { method: "POST" });

    const context1 = await browser.newContext();
    const context2 = await browser.newContext();

    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    await page1.goto("http://localhost:3000");
    await page2.goto("http://localhost:3000");

    await page1.waitForLoadState("networkidle");
    await page2.waitForLoadState("networkidle");

    // Create task in page1
    await page1.locator(".kanban-column").first().getByText("+ Add Task").click();
    await page1.getByPlaceholder("Enter task title").fill("Move Sync Test");
    await page1.getByText("Create Task").click();

    await expect(page2.getByText("Move Sync Test")).toBeVisible({ timeout: 3000 });

    // Move task in page2
    const taskCard = page2.getByText("Move Sync Test").locator("..").locator("..");
    const doneColumn = page2.locator(".kanban-column").nth(2);
    await taskCard.dragTo(doneColumn);

    await page1.waitForTimeout(1000);

    // Verify task moved in page1
    const page1DoneColumn = page1.locator(".kanban-column").nth(2);
    await expect(page1DoneColumn.getByText("Move Sync Test")).toBeVisible({ timeout: 3000 });

    await context1.close();
    await context2.close();
  });
});
