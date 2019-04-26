/********************************************************************************
 * Copyright (c) 2018 TypeFox and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/

import { inject } from "inversify";
import { Action } from "../../base/actions/action";
import { Command, CommandExecutionContext, CommandResult } from "../../base/commands/command";
import { SModelElement } from "../../base/model/smodel";
import { SModelExtension } from "../../base/model/smodel-extension";
import { TYPES } from "../../base/types";
import { MouseListener } from "../../base/views/mouse-tool";
import { SLabel } from "../../graph/sgraph";

export const editLabelFeature = Symbol('editLabelFeature');

export interface EditableLabel extends SModelExtension {
}

export function isEditableLabel<T extends SModelElement>(element: T): element is T & EditableLabel {
    return element instanceof SLabel && element.hasFeature(editLabelFeature);
}

export class EditLabelAction implements Action {
    static KIND = 'EditLabel';
    kind = EditLabelAction.KIND;
    constructor(readonly labelId: string) { }
}

export class ApplyLabelEditAction implements Action {
    static KIND = 'ApplyLabelEdit';
    kind = ApplyLabelEditAction.KIND;
    constructor(readonly labelId: string, readonly text: string) { }
}

export class ResolvedLabelEdit {
    label: SLabel;
    oldLabel: string;
    newLabel: string;
}

export class ApplyLabelEditCommand extends Command {
    static KIND = ApplyLabelEditAction.KIND;

    resolvedLabelEdit: ResolvedLabelEdit;

    constructor(@inject(TYPES.Action) public action: ApplyLabelEditAction) {
        super();
    }

    execute(context: CommandExecutionContext): CommandResult {
        const index = context.root.index;
        const label = index.getById(this.action.labelId);
        if (label && isEditableLabel(label) && label instanceof SLabel) {
            this.resolvedLabelEdit = { label, oldLabel: label.text, newLabel: this.action.text };
            label.text = this.action.text;
        }
        return context.root;
    }

    undo(context: CommandExecutionContext): CommandResult {
        if (this.resolvedLabelEdit) {
            this.resolvedLabelEdit.label.text = this.resolvedLabelEdit.oldLabel;
        }
        return context.root;
    }

    redo(context: CommandExecutionContext): CommandResult {
        if (this.resolvedLabelEdit) {
            this.resolvedLabelEdit.label.text = this.resolvedLabelEdit.newLabel;
        }
        return context.root;
    }

}

export class EditLabelMouseListener extends MouseListener {
    doubleClick(target: SModelElement, event: MouseEvent): (Action | Promise<Action>)[] {
        if (target instanceof SLabel && isEditableLabel(target)) {
            return [new EditLabelAction(target.id)];
        }
        return [];
    }
}
