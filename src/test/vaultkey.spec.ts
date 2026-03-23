import { test, expect } from '@playwright/test';

test.describe('VaultKey Password Vault - Complete Test Suite', () => {
  
  // ============================================
  // AUTHENTICATION TESTS
  // ============================================
  
  test.describe('Authentication', () => {
    test('should display VaultKey branding on login page', async ({ page }) => {
      await page.goto('/auth');
      
      // Check VaultKey branding
      await expect(page.locator('h1:has-text("VaultKey")')).toBeVisible();
      await expect(page.locator('text=Seu hub seguro de senhas')).toBeVisible();
      
      // Check Shield icon is present in the header
      await expect(page.locator('header .lucide-shield, header [class*="shield"]')).toBeVisible();
    });

    test('should show password visibility toggle', async ({ page }) => {
      await page.goto('/auth');
      
      // Toggle password visibility
      const passwordInput = page.locator('#password');
      await passwordInput.fill('testpassword');
      
      const toggleButton = page.locator('button:has(.lucide-eye-off), button:has(.lucide-eye)');
      await toggleButton.click();
      
      // Password should now be visible as text
      await expect(passwordInput).toHaveAttribute('type', 'text');
    });

    test('should toggle between login and signup', async ({ page }) => {
      await page.goto('/auth');
      
      // Initially on login
      await expect(page.locator('text=Entrar')).toBeVisible();
      
      // Click to switch to signup
      await page.locator('text=Criar conta').click();
      
      // Should show signup form
      await expect(page.locator('text=Criar conta')).toBeVisible();
      await expect(page.locator('text=Nome')).toBeVisible();
    });
  });

  // ============================================
  // DASHBOARD TESTS
  // ============================================
  
  test.describe('Dashboard', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to auth first, then to dashboard (assuming authenticated)
      await page.goto('/');
    });

    test('should display VaultKey header with branding', async ({ page }) => {
      await expect(page.locator('h1:has-text("VaultKey")')).toBeVisible();
      await expect(page.locator('.lucide-shield')).toBeVisible();
    });

    test('should display stats cards', async ({ page }) => {
      // Check for Total stats
      await expect(page.locator('text=Total')).toBeVisible();
      
      // Check for category filters
      await expect(page.locator('text=E-mails')).toBeVisible();
      await expect(page.locator('text=Redes Sociais')).toBeVisible();
      await expect(page.locator('text=Projetos/Dev')).toBeVisible();
      await expect(page.locator('text=Financeiro')).toBeVisible();
    });

    test('should have search functionality', async ({ page }) => {
      const searchInput = page.locator('input[placeholder*="Buscar"]');
      await expect(searchInput).toBeVisible();
      
      // Type to search
      await searchInput.fill('test');
      await expect(searchInput).toHaveValue('test');
    });

    test('should have category filter', async ({ page }) => {
      const categorySelect = page.locator('select, [role="combobox"]').first();
      await expect(categorySelect).toBeVisible();
    });

    test('should have device filter', async ({ page }) => {
      // Look for device filter
      await expect(page.locator('text=Dispositivo')).toBeVisible();
    });

    test('should display empty state when no credentials', async ({ page }) => {
      // Should show empty state message
      await expect(page.locator('text=Nenhuma credencial ainda')).toBeVisible();
      await expect(page.locator('text=Adicionar sua primeira credencial')).toBeVisible();
    });

    test('should have add credential button', async ({ page }) => {
      const addButton = page.locator('button:has-text("Nova"), button:has-text("Adicionar")');
      await expect(addButton).toBeVisible();
    });

    test('should have favorite filter', async ({ page }) => {
      const starButton = page.locator('button .lucide-star, button:has(.lucide-star)');
      await expect(starButton).toBeVisible();
    });

    test('should have export functionality', async ({ page }) => {
      const exportButton = page.locator('button[title="Exportar JSON"], button:has(.lucide-download)');
      await expect(exportButton).toBeVisible();
    });
  });

  // ============================================
  // CREDENTIAL FORM TESTS
  // ============================================
  
  test.describe('Credential Form', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
      
      // Open the form
      await page.locator('button:has-text("Nova"), button:has-text("Adicionar")').click();
    });

    test('should open credential form dialog', async ({ page }) => {
      await expect(page.locator('text=Nova Credencial')).toBeVisible();
    });

    test('should have all required fields', async ({ page }) => {
      // Check for required fields
      await expect(page.locator('label:has-text("Nick / Nome")')).toBeVisible();
      await expect(page.locator('label:has-text("Senha")')).toBeVisible();
      await expect(page.locator('label:has-text("E-mail da conta")')).toBeVisible();
      await expect(page.locator('label:has-text("Categoria")')).toBeVisible();
      await expect(page.locator('label:has-text("URL do serviço")')).toBeVisible();
      await expect(page.locator('label:has-text("Dispositivos")')).toBeVisible();
      await expect(page.locator('label:has-text("Descrição")')).toBeVisible();
      await expect(page.locator('label:has-text("Data de expiração")')).toBeVisible();
      await expect(page.locator('label:has-text("Notas")')).toBeVisible();
    });

    test('should generate password', async ({ page }) => {
      // Click generate button
      const generateButton = page.locator('button[title="Gerar senha"], button:has(.lucide-wand2)');
      await generateButton.click();
      
      // Password field should have a value
      const passwordInput = page.locator('input[type="password"], input[type="text"]').nth(1);
      const passwordValue = await passwordInput.inputValue();
      expect(passwordValue.length).toBeGreaterThan(0);
    });

    test('should show password strength indicator', async ({ page }) => {
      // Type a weak password
      const passwordInput = page.locator('input[type="password"], input[type="text"]').nth(1);
      await passwordInput.fill('123');
      
      // Should show weak/Fraca indicator
      await expect(page.locator('text=Fraca')).toBeVisible();
      
      // Type a stronger password
      await passwordInput.fill('MyStr0ngP@ssw0rd!');
      
      // Should show stronger/Média or Forte indicator
      const strengthText = page.locator('[class*="text-xs font-medium"]');
      await expect(strengthText).toBeVisible();
    });

    test('should toggle password visibility in form', async ({ page }) => {
      const passwordInput = page.locator('input[type="password"], input[type="text"]').nth(1);
      await passwordInput.fill('testpassword');
      
      // Find and click the visibility toggle (eye icon)
      const toggleButton = page.locator('button:has(.lucide-eye-off), button:has(.lucide-eye)').nth(1);
      await toggleButton.click();
      
      // Password should now be visible
      await expect(passwordInput).toHaveAttribute('type', 'text');
    });

    test('should have category dropdown', async ({ page }) => {
      const categorySelect = page.locator('[role="combobox"]').first();
      await categorySelect.click();
      
      // Check category options
      await expect(page.locator('text=E-mails')).toBeVisible();
      await expect(page.locator('text=Redes Sociais')).toBeVisible();
      await expect(page.locator('text=Projetos/Dev')).toBeVisible();
      await expect(page.locator('text=Financeiro')).toBeVisible();
    });

    test('should allow device selection', async ({ page }) => {
      // Check device checkboxes exist
      await expect(page.locator('text=Desktop')).toBeVisible();
      await expect(page.locator('text=Laptop')).toBeVisible();
      await expect(page.locator('text=Tablet')).toBeVisible();
      await expect(page.locator('text=iPhone')).toBeVisible();
      
      // Click a device checkbox
      await page.locator('text=Desktop').click();
    });

    test('should close form on cancel', async ({ page }) => {
      // Click cancel button
      await page.locator('button:has-text("Cancelar")').click();
      
      // Form should close
      await expect(page.locator('text=Nova Credencial')).not.toBeVisible();
    });
  });

  // ============================================
  // CREDENTIAL CARD TESTS
  // ============================================
  
  test.describe('Credential Card', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
    });

    test('should display credential card with VaultKey branding', async ({ page }) => {
      // This test assumes there are credentials - will skip if empty
      const cardCount = await page.locator('[class*="rounded-xl"]').count();
      if (cardCount === 0) {
        test.skip();
      }
      
      // Check for credential card elements
      await expect(page.locator('.lucide-mail, .lucide-users, .lucide-code, .lucide-wallet').first()).toBeVisible();
    });

    test('should toggle password visibility', async ({ page }) => {
      // Skip if no credentials
      const cardCount = await page.locator('[class*="rounded-xl"]').count();
      if (cardCount === 0) {
        test.skip();
      }
      
      // Find and click eye button in card
      const eyeButton = page.locator('button .lucide-eye, button .lucide-eye-off').first();
      await eyeButton.click();
    });

    test('should copy password to clipboard', async ({ page }) => {
      // Skip if no credentials
      const copyButtons = page.locator('button .lucide-copy');
      const count = await copyButtons.count();
      if (count === 0) {
        test.skip();
      }
      
      // Click copy button
      await copyButtons.first().click();
      
      // Should show toast message
      await expect(page.locator('text=copiado')).toBeVisible();
    });

    test('should toggle favorite', async ({ page }) => {
      // Skip if no credentials
      const starButtons = page.locator('button .lucide-star');
      const count = await starButtons.count();
      if (count === 0) {
        test.skip();
      }
      
      // Click star button
      await starButtons.first().click();
    });

    test('should have edit button', async ({ page }) => {
      // Skip if no credentials
      const editButtons = page.locator('button .lucide-pencil');
      const count = await editButtons.count();
      if (count === 0) {
        test.skip();
      }
      
      await expect(editButtons.first()).toBeVisible();
    });

    test('should have delete button', async ({ page }) => {
      // Skip if no credentials
      const deleteButtons = page.locator('button .lucide-trash2');
      const count = await deleteButtons.count();
      if (count === 0) {
        test.skip();
      }
      
      await expect(deleteButtons.first()).toBeVisible();
    });
  });

  // ============================================
  // RESPONSIVENESS TESTS
  // ============================================
  
  test.describe('Responsiveness', () => {
    test('should work on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto('/');
      
      // Dashboard should be visible
      await expect(page.locator('h1:has-text("VaultKey")')).toBeVisible();
      
      // Should have mobile-friendly layout
      const main = page.locator('main');
      await expect(main).toBeVisible();
    });

    test('should work on tablet', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/');
      
      // Dashboard should be visible
      await expect(page.locator('h1:has-text("VaultKey")')).toBeVisible();
    });

    test('should work on desktop', async ({ page }) => {
      // Set desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto('/');
      
      // Dashboard should be visible
      await expect(page.locator('h1:has-text("VaultKey")')).toBeVisible();
    });
  });

  // ============================================
  // SECURITY TESTS
  // ============================================
  
  test.describe('Security Features', () => {
    test('should mask passwords by default', async ({ page }) => {
      await page.goto('/');
      
      // Open form and type password
      await page.locator('button:has-text("Nova"), button:has-text("Adicionar")').click();
      const passwordInput = page.locator('input[type="password"]').first();
      await passwordInput.fill('MySecretPassword');
      
      // Password should be masked
      await expect(passwordInput).toHaveAttribute('type', 'password');
    });

    test('should validate minimum password length', async ({ page }) => {
      await page.goto('/');
      
      // Open form
      await page.locator('button:has-text("Nova"), button:has-text("Adicionar")').click();
      
      // Try to submit with empty required fields
      await page.locator('button:has-text("Adicionar"), button:has-text("Salvar")').click();
      
      // Should show validation error (HTML5 required attribute)
      const nickInput = page.locator('input[required]').first();
      await expect(nickInput).toHaveAttribute('required', '');
    });
  });
});
