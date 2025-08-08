use serde::{Deserialize, Serialize};
use std::env;
use std::collections::HashMap;

// ADO Credentials structure
#[derive(Debug, Serialize, Deserialize)]
pub struct AdoCredentials {
    pub organization: String,
    pub personal_access_token: String,
    pub project: Option<String>,
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

/// Get ADO credentials from environment variables
#[tauri::command]
fn get_ado_credentials() -> Result<AdoCredentials, String> {
    println!("📞 [COMMAND] get_ado_credentials invoked");
    let start_time = std::time::Instant::now();
    
    // Load .env file if it exists
    dotenv::dotenv().ok();
    println!("🔄 Environment variables reloaded from .env file");

    println!("🔍 Attempting to read ADO_ORGANIZATION environment variable...");
    let organization = env::var("ADO_ORGANIZATION")
        .map_err(|e| {
            println!("❌ ADO_ORGANIZATION not found: {:?}", e);
            "ADO_ORGANIZATION environment variable not found".to_string()
        })?;

    println!("🔍 Attempting to read ADO_PAT environment variable...");
    let personal_access_token = env::var("ADO_PAT")
        .map_err(|e| {
            println!("❌ ADO_PAT not found: {:?}", e);
            "ADO_PAT environment variable not found".to_string()
        })?;

    println!("🔍 Attempting to read ADO_PROJECT environment variable (optional)...");
    // Project is optional - can be provided via environment or configured in app
    let project = env::var("ADO_PROJECT").ok().filter(|p| !p.trim().is_empty());

    if organization.trim().is_empty() {
        println!("❌ ADO_ORGANIZATION is empty after trimming");
        return Err("ADO_ORGANIZATION cannot be empty".to_string());
    }

    if personal_access_token.trim().is_empty() {
        println!("❌ ADO_PAT is empty after trimming");
        return Err("ADO_PAT cannot be empty".to_string());
    }

    let elapsed = start_time.elapsed();
    println!("🔐 Successfully loaded ADO credentials for organization: {} (took {:?})", organization, elapsed);
    println!("📊 PAT length: {} characters", personal_access_token.len());
    
    if let Some(ref proj) = project {
        println!("📁 Default project configured: {}", proj);
    } else {
        println!("📁 No default project configured - will use app default or user selection");
    }

    Ok(AdoCredentials {
        organization: organization.trim().to_string(),
        personal_access_token: personal_access_token.trim().to_string(),
        project: project.map(|p| p.trim().to_string()),
    })
}

/// Validate if ADO configuration is available
#[tauri::command]
fn validate_ado_config() -> bool {
    println!("📞 [COMMAND] validate_ado_config invoked");
    let start_time = std::time::Instant::now();
    
    dotenv::dotenv().ok();
    println!("🔄 Environment variables reloaded for validation");
    
    println!("🔍 Checking ADO_ORGANIZATION presence...");
    let has_org = env::var("ADO_ORGANIZATION").is_ok();
    
    println!("🔍 Checking ADO_PAT presence...");
    let has_pat = env::var("ADO_PAT").is_ok();
    
    println!("🔍 Checking ADO_PROJECT presence (optional)...");
    let has_project = env::var("ADO_PROJECT").is_ok();
    
    let is_valid = has_org && has_pat;
    let elapsed = start_time.elapsed();
    
    println!("📊 Configuration validation results (took {:?}):", elapsed);
    println!("  ├─ ADO_ORGANIZATION: {}", if has_org { "✅ Present" } else { "❌ Missing" });
    println!("  ├─ ADO_PAT: {}", if has_pat { "✅ Present" } else { "❌ Missing" });
    println!("  └─ ADO_PROJECT: {}", if has_project { "✅ Present" } else { "⚪ Optional (not set)" });
    
    if is_valid {
        println!("✅ ADO environment configuration is valid and ready for use");
    } else {
        println!("❌ ADO environment configuration is incomplete:");
        if !has_org { println!("  🔸 Missing required ADO_ORGANIZATION environment variable"); }
        if !has_pat { println!("  🔸 Missing required ADO_PAT environment variable"); }
        println!("  💡 Tip: Create a .env file in the project root with these variables");
    }
    
    is_valid
}

// Diagnostic information structure
#[derive(Debug, Serialize, Deserialize)]
pub struct AuthDiagnostics {
    pub environment_status: HashMap<String, String>,
    pub validation_results: HashMap<String, bool>,
    pub configuration_health: String,
    pub recommendations: Vec<String>,
    pub system_info: HashMap<String, String>,
}

/// Get comprehensive authentication diagnostics
#[tauri::command]
fn get_auth_diagnostics() -> AuthDiagnostics {
    println!("📞 [COMMAND] get_auth_diagnostics invoked");
    println!("🔬 Performing comprehensive authentication system analysis...");
    let start_time = std::time::Instant::now();
    
    // Load environment
    dotenv::dotenv().ok();
    
    let mut env_status = HashMap::new();
    let mut validation_results = HashMap::new();
    let mut recommendations = Vec::new();
    let mut system_info = HashMap::new();
    
    // Check environment variables
    println!("📊 Analyzing environment variables...");
    let ado_org = env::var("ADO_ORGANIZATION");
    let ado_pat = env::var("ADO_PAT"); 
    let ado_project = env::var("ADO_PROJECT");
    
    match &ado_org {
        Ok(org) => {
            env_status.insert("ADO_ORGANIZATION".to_string(), format!("✅ Set: {}", org));
            validation_results.insert("has_organization".to_string(), true);
            if org.trim().is_empty() {
                recommendations.push("ADO_ORGANIZATION is set but empty - please provide a valid organization name".to_string());
            }
        },
        Err(_) => {
            env_status.insert("ADO_ORGANIZATION".to_string(), "❌ Not set".to_string());
            validation_results.insert("has_organization".to_string(), false);
            recommendations.push("Set ADO_ORGANIZATION environment variable to your Azure DevOps organization name".to_string());
        }
    }
    
    match &ado_pat {
        Ok(pat) => {
            let masked_pat = if pat.len() > 8 {
                format!("{}...{}", &pat[..4], &pat[pat.len()-4..])
            } else {
                "***".to_string()
            };
            env_status.insert("ADO_PAT".to_string(), format!("✅ Set: {} ({} chars)", masked_pat, pat.len()));
            validation_results.insert("has_pat".to_string(), true);
            
            if pat.trim().is_empty() {
                recommendations.push("ADO_PAT is set but empty - please provide a valid Personal Access Token".to_string());
            } else if pat.len() < 20 {
                recommendations.push("ADO_PAT seems too short - Azure DevOps PATs are typically longer".to_string());
            }
        },
        Err(_) => {
            env_status.insert("ADO_PAT".to_string(), "❌ Not set".to_string());
            validation_results.insert("has_pat".to_string(), false);
            recommendations.push("Set ADO_PAT environment variable to your Azure DevOps Personal Access Token".to_string());
        }
    }
    
    match &ado_project {
        Ok(project) => {
            env_status.insert("ADO_PROJECT".to_string(), format!("✅ Set: {}", project));
            validation_results.insert("has_project".to_string(), true);
        },
        Err(_) => {
            env_status.insert("ADO_PROJECT".to_string(), "⚪ Optional (not set)".to_string());
            validation_results.insert("has_project".to_string(), false);
            recommendations.push("Consider setting ADO_PROJECT for a default project (optional)".to_string());
        }
    }
    
    // Overall health assessment
    let has_required = validation_results.get("has_organization").copied().unwrap_or(false) && 
                     validation_results.get("has_pat").copied().unwrap_or(false);
    
    let health = if has_required {
        "🟢 HEALTHY - All required credentials configured"
    } else {
        "🔴 INCOMPLETE - Missing required credentials"
    };
    
    // System information
    system_info.insert("platform".to_string(), std::env::consts::OS.to_string());
    system_info.insert("architecture".to_string(), std::env::consts::ARCH.to_string());
    system_info.insert("dotenv_support".to_string(), "✅ Available".to_string());
    
    // Add .env file detection
    let env_file_exists = std::path::Path::new(".env").exists();
    system_info.insert("dotenv_file".to_string(), 
        if env_file_exists { "✅ .env file found" } else { "⚪ .env file not found" }.to_string());
    
    if !env_file_exists && recommendations.is_empty() == false {
        recommendations.push("Create a .env file in the project root with your ADO credentials".to_string());
    }
    
    let elapsed = start_time.elapsed();
    println!("🏁 Authentication diagnostics completed in {:?}", elapsed);
    println!("📋 Health Status: {}", health);
    println!("💡 Recommendations: {} items", recommendations.len());
    
    AuthDiagnostics {
        environment_status: env_status,
        validation_results,
        configuration_health: health.to_string(),
        recommendations,
        system_info,
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Enhanced startup logging
    println!("🚀 Starting ADO Development Intel App (Tauri Backend)");
    println!("🔧 Initializing Tauri runtime...");
    
    // Load and validate environment on startup
    dotenv::dotenv().ok();
    println!("📂 Environment file (.env) loading attempt completed");
    
    let result = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, get_ado_credentials, validate_ado_config, get_auth_diagnostics])
        .setup(|_app| {
            println!("⚡ Tauri application setup completed successfully");
            println!("🎯 Available commands: greet, get_ado_credentials, validate_ado_config, get_auth_diagnostics");
            Ok(())
        })
        .run(tauri::generate_context!());
    
    if let Err(e) = result {
        eprintln!("❌ Failed to run Tauri application: {}", e);
        std::process::exit(1);
    }
}
