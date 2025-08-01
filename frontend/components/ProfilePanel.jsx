import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Trash2, Plus } from 'lucide-react';

import '@/styles/ProfilePanel.scss';

const ProfilePanel = ({ userProfile, onDeleteIdentifier, onClose }) => {
    const [showConfirm, setShowConfirm] = useState(null);

    // Build identifiers list from the new backend structure
    const identifiers = [];
    if (userProfile?.identifiers && Array.isArray(userProfile.identifiers)) {
        userProfile.identifiers.forEach((identifier) => {
            identifiers.push({
                id: identifier.id,
                type: identifier.label,
                value: 'Set' // We don't show actual values for security
            });
        });
    }

    return (
        <div className="profile-panel-overlay">
            <div className="profile-panel-modal">
                <Card>
                    <CardHeader>
                        <div className="panel-header">
                            <span className="panel-title"><CardTitle>My Identifiers</CardTitle></span>
                            <Button variant="ghost" onClick={onClose} className="close-button"><X size={20} /></Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {identifiers.length === 0 ? (
                            <div className="empty-state">No identifiers found.</div>
                        ) : (
                            <ul className="identifier-list">
                                {identifiers.map((id, idx) => (
                                    <li key={idx} className="identifier-item">
                                        <span className="identifier-type">{id.type}:</span>
                                        <span className="identifier-value">{id.value}</span>
                                        <Button variant="outline" size="icon" onClick={() => setShowConfirm(idx)} className="delete-identifier-btn">
                                            <Trash2 size={16} />
                                        </Button>
                                        {showConfirm === idx && (
                                            <div className="confirm-delete">
                                                <span>Delete this {id.type}?</span>
                                                <Button size="sm" onClick={() => { setShowConfirm(null); onDeleteIdentifier(id.id); }}>Yes</Button>
                                                <Button size="sm" variant="outline" onClick={() => setShowConfirm(null)}>No</Button>
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                        {/* Optionally, add a button to add new custom identifiers */}
                        {/* <Button className="add-identifier-btn"><Plus size={16} /> Add Identifier</Button> */}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default ProfilePanel;
