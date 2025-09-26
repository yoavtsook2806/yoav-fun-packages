#!/bin/bash

# 🔄 Common Database Migrations
# Quick commands for frequent migration tasks

echo "🔄 Common Database Migrations"
echo "=============================="

# Function to run migration with confirmation
run_migration() {
    echo "About to run: $1"
    read -p "Continue? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        eval $1
    else
        echo "Skipped."
    fi
}

case "$1" in
    "add-isadmin")
        echo "Adding isAdmin field to coaches..."
        run_migration "node scripts/generic-migration.js coaches add-fields '{\"isAdmin\": false}'"
        ;;
    
    "add-plans-to-trainers")
        echo "Adding plans array to trainers..."
        run_migration "node scripts/generic-migration.js trainers add-fields '{\"plans\": []}'"
        ;;
    
    "remove-muscle-groups")
        echo "Removing muscleGroup field from exercises (clean recreate)..."
        run_migration "node scripts/generic-migration.js exercises clean-recreate '{}'"
        ;;
    
    "add-admin-fields-exercises")
        echo "Adding admin fields to exercises..."
        run_migration "node scripts/generic-migration.js exercises add-fields '{\"isAdminExercise\": false, \"originalExerciseId\": null}'"
        ;;
    
    "add-admin-fields-plans")
        echo "Adding admin fields to plans..."
        run_migration "node scripts/generic-migration.js plans add-fields '{\"isAdminPlan\": false, \"originalPlanId\": null, \"customTrainee\": null}'"
        ;;
    
    "create-admin-coach")
        echo "Creating admin coach..."
        admin_coach='[{
            "coachId": "admin-'$(date +%s)'",
            "name": "Admin User",
            "email": "admin@trainerly.com", 
            "nickname": "admin",
            "passwordHash": "temp-hash-for-debugging",
            "valid": true,
            "isAdmin": true,
            "createdAt": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'",
            "updatedAt": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'"
        }]'
        run_migration "node scripts/generic-migration.js coaches add-records '$admin_coach'"
        ;;
    
    "backup-all")
        echo "Creating backup of all tables..."
        for table in coaches trainers exercises plans progress; do
            echo "Backing up $table..."
            node scripts/generic-migration.js $table backup
        done
        ;;
    
    "clean-dev-db")
        echo "⚠️  WARNING: This will delete ALL data from dev database!"
        read -p "Are you absolutely sure? Type 'DELETE ALL' to confirm: " confirm
        if [ "$confirm" = "DELETE ALL" ]; then
            for table in coaches trainers exercises plans progress plan-assignments; do
                echo "Deleting all from $table..."
                node scripts/generic-migration.js $table delete-all
            done
            echo "✅ Dev database cleaned"
        else
            echo "Cancelled."
        fi
        ;;
    
    *)
        echo "Usage: $0 <command>"
        echo ""
        echo "Available commands:"
        echo "  add-isadmin              - Add isAdmin field to coaches"
        echo "  add-plans-to-trainers    - Add plans array to trainers"  
        echo "  remove-muscle-groups     - Remove muscleGroup from exercises"
        echo "  add-admin-fields-exercises - Add admin fields to exercises"
        echo "  add-admin-fields-plans   - Add admin fields to plans"
        echo "  create-admin-coach       - Create a new admin coach"
        echo "  backup-all              - Backup all tables"
        echo "  clean-dev-db            - Delete all data (USE WITH CAUTION)"
        echo ""
        echo "Examples:"
        echo "  $0 add-isadmin"
        echo "  $0 backup-all"
        ;;
esac
