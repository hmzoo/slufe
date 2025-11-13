# Commit Message

feat: Add comprehensive variable reference system for workflows

## Summary

Implement a complete variable reference and metadata system for workflow tasks, allowing users to easily reference outputs from previous tasks using `{{taskId.outputKey}}` syntax.

## Changes

### Bug Fixes
- **CollectionMediaGallery**: Fix image selection by using `media.url` instead of non-existent `media.id`
- **Backend Tasks**: Add automatic snake_case to camelCase parameter normalization for backward compatibility
- **EditImageTask**: Add 6 missing API parameters (outputFormat, outputQuality, goFast, seed, disableSafetyChecker)

### Features

#### Documentation
- Add `TASK_VARIABLES_REFERENCE.md`: Complete documentation of all task variables (350+ lines)
- Add `taskMetadata.json`: Structured metadata for all 12 tasks
- Add `VARIABLES_USAGE.md`: Developer guide for using the variable system
- Add `SESSION_SUMMARY.md`: Detailed summary of all changes

#### Code
- Add `variableHelper.js`: Utility with 11 functions for variable manipulation
  - `getTaskMetadata()`: Get task metadata
  - `getAvailableVariables()`: List available variables in workflow
  - `validateVariableReference()`: Validate variable references
  - `suggestTaskId()`: Suggest task IDs based on prefix
  - And 7 more helper functions

#### UI Components
- Add `VariableHelper.vue`: Complete list of available variables with filtering
- Add `TaskVariableInfo.vue`: Compact task metadata display component

#### Metadata Enrichment
- Enrich all 12 tasks in `taskDefinitions.js` with:
  - `variablePrefix`: Suggested prefix for task IDs
  - `variableExample`: Example variable usage
  - `outputDescription`: Description of available outputs
  - `variableDescription` for all inputs accepting variables
  - `variablePath` and `example` for all outputs

### Improvements
- Standardize all field names to camelCase (12+ fields renamed)
- Add complete API parameter support for edit_image task
- Improve developer experience with inline documentation

## Files Modified (4)

1. `frontend/src/components/CollectionMediaGallery.vue`
   - Fix image selection using URL as unique identifier

2. `frontend/src/config/taskDefinitions.js`
   - Standardize field names (snake_case → camelCase)
   - Add 6 edit_image parameters
   - Enrich 12 tasks with metadata

3. `backend/services/tasks/GenerateVideoI2VTask.js`
   - Add parameter normalization (14 fields)

4. `backend/services/tasks/EditImageTask.js`
   - Add parameter normalization (8 fields)
   - Add 6 new API parameters
   - Update default parameters

## Files Created (7)

1. `frontend/src/config/TASK_VARIABLES_REFERENCE.md`
2. `frontend/src/config/taskMetadata.json`
3. `frontend/src/utils/variableHelper.js`
4. `frontend/src/components/VariableHelper.vue`
5. `frontend/src/components/TaskVariableInfo.vue`
6. `frontend/src/config/VARIABLES_USAGE.md`
7. `SESSION_SUMMARY.md`

## Breaking Changes

None. All changes are backward compatible thanks to automatic parameter normalization.

## Testing

- ✅ Image selection works correctly (single & multiple)
- ✅ Variables can be referenced using `{{taskId.outputKey}}` syntax
- ✅ All edit_image parameters are transmitted to API
- ✅ Helper functions validate variable references correctly

## Documentation

See:
- `TASK_VARIABLES_REFERENCE.md` for complete variable documentation
- `VARIABLES_USAGE.md` for developer guide
- `SESSION_SUMMARY.md` for detailed change log

## Impact

- **UX**: Significantly improved workflow creation experience
- **DX**: Better developer experience with inline documentation
- **Maintainability**: Standardized naming and complete metadata
- **Functionality**: All API features now accessible from UI

---

Closes #[issue-number]
