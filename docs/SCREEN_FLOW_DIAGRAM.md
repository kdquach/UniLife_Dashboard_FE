# Screen Flow Diagram (English)

Below is a Mermaid flowchart for the screens in your attached image.

- **Rectangle** = main screen
- **Ellipse** = popup/modal
- **Arrow labels** = user actions

```mermaid
flowchart TD
    L[Login]
    D[Dashboard]

    PM[Payroll Management]
    CS[Canteen Schedule]
    FM[Feedback Management]
    AL[Audit Log]
    IM[Inventory Management]
    VM[Voucher Management]
    SM[Shift Management]
    STM[Staff Management]

    %% Popups/Modals (ellipse)
    PM_G((Generate Payroll Dialog))
    PM_A((Approve / Pay / Delete Confirmation))

    AL_D((Audit Log Detail Modal))
    AL_C((Delete Old Logs Confirmation))

    IM_P((Edit Product Modal))
    IM_I((Edit Ingredient Modal))
    IM_S((Update Ingredient Stock Modal))

    VM_F((Voucher Form Modal: Create/Edit))

    SM_C((Discard Unsaved Draft Confirmation))

    STM_D((Staff Detail Modal))
    STM_C((Create Staff Modal))
    STM_U((Update Staff Modal))

    FM_R((Re-order Result Modal))
    FM_F((Product Feedback Modal))

    %% Main flow
    L -->|Submit credentials| D

    D -->|Sidebar: Payroll| PM
    D -->|Sidebar: Canteen schedule| CS
    D -->|Sidebar: Inventory| IM
    D -->|Sidebar: Voucher| VM
    D -->|Sidebar: Shift| SM
    D -->|Sidebar: Staff| STM
    D -->|Sidebar: Audit log| AL
    D -->|Open order detail / feedback area| FM

    %% Payroll interactions
    PM -->|Click "Create payroll"| PM_G
    PM_G -->|Submit payroll period| PM
    PM -->|Click Approve / Pay / Delete| PM_A
    PM_A -->|Confirm action| PM

    %% Audit interactions
    AL -->|Click "View detail"| AL_D
    AL_D -->|Close| AL
    AL -->|Click "Delete old logs"| AL_C
    AL_C -->|Confirm delete| AL

    %% Inventory interactions
    IM -->|Click edit product| IM_P
    IM_P -->|Save product| IM
    IM -->|Click edit ingredient| IM_I
    IM_I -->|Save ingredient| IM
    IM -->|Click update stock| IM_S
    IM_S -->|Submit stock change| IM

    %% Voucher interactions
    VM -->|Click create/edit voucher| VM_F
    VM_F -->|Save voucher| VM

    %% Shift interactions
    SM -->|Switch mode with unsaved changes| SM_C
    SM_C -->|Confirm discard| SM

    %% Staff interactions
    STM -->|View staff details| STM_D
    STM_D -->|Close| STM
    STM -->|Click "Add staff"| STM_C
    STM_C -->|Create account| STM
    STM -->|Click "Update"| STM_U
    STM_U -->|Save changes| STM

    %% Feedback interactions
    FM -->|Click "Re-order"| FM_R
    FM_R -->|Open cart / close| FM
    FM -->|Click "Rate product"| FM_F
    FM_F -->|Submit feedback| FM
```

## Notes

- **Canteen Schedule** is represented by the **Schedule tab** inside the Canteen Management screen.
- **Shift Management** corresponds to manager shift scheduling/review flow.
- **Feedback Management** is represented by feedback/re-order modals in order detail flow.

## PlantUML Version

- PlantUML file: [docs/SCREEN_FLOW_DIAGRAM.puml](SCREEN_FLOW_DIAGRAM.puml)
